'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  requireRole,
  zodFieldErrors,
  parseId,
  ROLES,
} from '@/lib/action-helpers';
import {
  invoiceInputSchema,
  computeTagSubtotal,
  type InvoiceInput,
} from './schema';

export type { ActionResult } from '@/lib/action-helpers';
import type { ActionResult } from '@/lib/action-helpers';

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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Validation failed',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const invoiceId = parseId(id);
  if (!invoiceId) return { ok: false, error: 'Invalid invoice id' };
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
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return denied;

  const invoiceId = parseId(id);
  if (!invoiceId) return { ok: false, error: 'Invalid invoice id' };

  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
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
