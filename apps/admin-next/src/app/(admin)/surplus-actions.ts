'use server';

/**
 * RN-023 — acciones de reparto de sobrepago compartidas por órdenes y
 * entregas (ADR-0008). El cobro con «repartir excedente» vive en
 * `confirmOrderPaymentAction` / `confirmDeliveryPaymentAction`; aquí están
 * la carga de pendientes para la vista previa y el reparto explícito de un
 * sobrepago ya registrado.
 */
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseId, requireRole, requireStaff, ROLES } from '@/lib/action-helpers';
import {
  loadPendingTargets,
  redistributeSurplusInTx,
} from '@/lib/surplus-redistribution';
import type {
  PendingTarget,
  RedistributeResult,
  SurplusTargetKind,
} from '@/lib/surplus';

/** Pendientes del cliente (sin la partida origen) para la vista previa del panel de pago. */
export async function loadClientPendingTargetsAction(
  clientId: string,
  excludeKind: SurplusTargetKind,
  excludeId: string
): Promise<PendingTarget[]> {
  const { denied } = await requireStaff();
  if (denied) return [];
  const cid = parseId(clientId);
  const xid = parseId(excludeId);
  if (!cid || !xid) return [];
  return loadPendingTargets(prisma, cid, { kind: excludeKind, id: xid });
}

async function redistribute(
  kind: SurplusTargetKind,
  rawId: string,
  allowed: readonly string[]
): Promise<RedistributeResult> {
  const { denied } = await requireRole(allowed);
  if (denied) return denied;
  const id = parseId(rawId);
  if (!id) return { ok: false, error: 'Identificador inválido' };

  const result = await prisma.$transaction((tx) =>
    redistributeSurplusInTx(tx, { kind, id })
  );
  if ('error' in result) return { ok: false, error: result.error };
  if (result.moved <= 0) {
    return {
      ok: false,
      error:
        result.remaining > 0
          ? 'El cliente no tiene pendientes; el exceso queda como saldo a favor'
          : 'Esta partida no tiene sobrepago',
    };
  }

  revalidatePath('/orders');
  revalidatePath('/delivery');
  revalidatePath('/dashboard');
  revalidatePath('/users');
  for (const a of result.allocations) {
    revalidatePath(a.kind === 'order' ? `/orders/${a.id}` : `/delivery/${a.id}`);
  }
  revalidatePath(kind === 'order' ? `/orders/${rawId}` : `/delivery/${rawId}`);

  return {
    ok: true,
    redistributed: {
      moved: result.moved,
      count: result.allocations.length,
      remaining: result.remaining,
    },
  };
}

/** Reparte el sobrepago ya registrado en una orden (RN-023). */
export async function redistributeOrderSurplusAction(
  id: string
): Promise<RedistributeResult> {
  return redistribute('order', id, ROLES.orders);
}

/** Reparte el sobrepago ya registrado en una entrega (RN-023). */
export async function redistributeDeliverySurplusAction(
  id: string
): Promise<RedistributeResult> {
  return redistribute('delivery', id, ROLES.delivery);
}
