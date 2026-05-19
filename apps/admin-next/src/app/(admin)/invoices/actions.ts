'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  invoiceInputSchema,
  computeTagSubtotal,
  type InvoiceInput,
} from './schema';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdminLikeRole(): Promise<ActionResult | null> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };
  const allowed = new Set(['admin', 'accountant']);
  if (!allowed.has(session.user.role)) {
    return { ok: false, error: 'Forbidden' };
  }
  return null;
}

function flattenZodErrors(
  result: ReturnType<typeof invoiceInputSchema.safeParse>
): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Server is the source of truth for subtotal/total — never trust client math. */
function buildTagData(input: InvoiceInput) {
  const tags = input.tags.map((t) => ({
    type: t.type,
    weight: t.weight,
    costPerLb: t.costPerLb,
    fixedCost: t.fixedCost,
    subtotal: computeTagSubtotal(t),
  }));
  const total =
    Math.round(tags.reduce((sum, t) => sum + t.subtotal, 0) * 100) / 100;
  return { tags, total };
}

export async function createInvoiceAction(
  input: InvoiceInput
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  const { tags, total } = buildTagData(parsed.data);

  await prisma.invoice.create({
    data: {
      date: new Date(parsed.data.date),
      total,
      tags: { create: tags },
    },
  });

  revalidatePath('/invoices');
  return { ok: true };
}

export async function updateInvoiceAction(
  id: string,
  input: InvoiceInput
): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: flattenZodErrors(parsed),
    };
  }

  const invoiceId = BigInt(id);
  const { tags, total } = buildTagData(parsed.data);

  try {
    await prisma.$transaction([
      prisma.tag.deleteMany({ where: { invoiceId } }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          date: new Date(parsed.data.date),
          total,
          tags: { create: tags },
        },
      }),
    ]);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Invoice not found' };
    }
    throw err;
  }

  revalidatePath('/invoices');
  return { ok: true };
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  const denied = await requireAdminLikeRole();
  if (denied) return denied;

  try {
    await prisma.invoice.delete({ where: { id: BigInt(id) } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return { ok: false, error: 'Invoice not found' };
    }
    throw err;
  }

  revalidatePath('/invoices');
  return { ok: true };
}
