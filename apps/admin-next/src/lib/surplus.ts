/**
 * RN-023 — Redistribución de un sobrepago (doc/procesos/reglas/pagos.md,
 * ADR-0008). Función PURA compartida con Django
 * (backend/api/services/payment_services.py: plan_surplus_distribution)
 * y verificada por doc/procesos/casos/surplus-distribution.json.
 *
 * Cuando el cliente paga en una orden o entrega más de lo que cuesta, el
 * exceso de EFECTIVO se reparte entre sus otras órdenes y entregas con
 * pendiente, de la más antigua a la más reciente. Lo que no alcance a
 * colocarse se queda en el origen como sobrepago (saldo a favor, RN-021).
 * El balance del cliente no cambia: solo se mueve efectivo entre partidas.
 */
import { round2 } from '@/lib/order-cost';

export type SurplusTargetKind = 'order' | 'delivery';

export interface SurplusTarget {
  kind: SurplusTargetKind;
  id: string;
  /** costo − efectivo − saldo aplicado (ya redondeado o no; se redondea aquí). */
  pending: number;
  /** Fecha de la partida: `createdAt` de la orden, `deliverDate` de la entrega (ISO). */
  date: string;
}

/** Partida pendiente del cliente tal como la ve la interfaz (sin BigInt). */
export interface PendingTarget extends SurplusTarget {
  label: string;
  cost: number;
}

/** Resultado de las acciones de reparto (RN-023). */
export type RedistributeResult =
  | { ok: true; redistributed: { moved: number; count: number; remaining: number } }
  | { ok: false; error: string };

export interface SurplusAllocation {
  kind: SurplusTargetKind;
  id: string;
  amount: number;
}

export interface SurplusPlan {
  allocations: SurplusAllocation[];
  /** Exceso que no cupo en ningún pendiente y permanece en el origen. */
  remaining: number;
}

/** Orden canónico: fecha ascendente; a igual fecha, órdenes antes que entregas; luego id numérico. */
export function sortSurplusTargets<T extends SurplusTarget>(targets: readonly T[]): T[] {
  return [...targets].sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    if (ta !== tb) return ta - tb;
    if (a.kind !== b.kind) return a.kind === 'order' ? -1 : 1;
    const ia = Number(a.id);
    const ib = Number(b.id);
    if (Number.isFinite(ia) && Number.isFinite(ib) && ia !== ib) return ia - ib;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Reparte `surplus` entre `targets`. Cada destino recibe
 * `min(restante, pendiente)`; se ignoran pendientes ≤ 0; se detiene cuando
 * no queda nada por repartir. Todas las cantidades a 2 decimales.
 */
export function planSurplusDistribution(
  surplus: number,
  targets: readonly SurplusTarget[]
): SurplusPlan {
  let remaining = round2(Math.max(0, surplus));
  const allocations: SurplusAllocation[] = [];
  if (remaining <= 0) return { allocations, remaining: 0 };

  for (const t of sortSurplusTargets(targets)) {
    if (remaining <= 0) break;
    const pending = round2(t.pending);
    if (pending <= 0) continue;
    const amount = round2(Math.min(remaining, pending));
    if (amount <= 0) continue;
    allocations.push({ kind: t.kind, id: t.id, amount });
    remaining = round2(remaining - amount);
  }
  return { allocations, remaining };
}

/**
 * Exceso de EFECTIVO que puede moverse desde una partida: lo cobrado por
 * encima del costo, pero nunca más que el efectivo registrado (el saldo
 * aplicado no se mueve, RN-022).
 */
export function movableSurplus(
  cost: number,
  cash: number,
  balanceApplied: number
): number {
  const excess = round2(cash + balanceApplied - cost);
  if (excess <= 0) return 0;
  return round2(Math.min(excess, Math.max(0, cash)));
}
