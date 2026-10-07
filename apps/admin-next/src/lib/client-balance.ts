/**
 * RN-021 (2.0.0, ADR-0009) — Saldo a favor y deuda del cliente.
 * Función PURA compartida con Django
 * (backend/api/services/balance_service.py: compute_client_balance) y
 * verificada por doc/procesos/casos/client-balance.json.
 *
 * Cada orden y cada entrega del cliente es una partida con costo,
 * efectivo cobrado y saldo aplicado. Por partida:
 *
 *   cubierto  = round2(efectivo + saldoAplicado)
 *   sobrepago = max(0, round2(cubierto − costo))
 *   pendiente = max(0, round2(costo − cubierto))
 *
 * Y para el cliente:
 *
 *   balance (saldo a favor) = max(0, round2(Σ sobrepago − Σ saldoAplicado))
 *   debt    (deuda)         = round2(Σ pendiente)
 *   net     (posición neta) = round2(Σ efectivo − Σ costo)
 *
 * `balance` es lo que el panel de pago puede aplicar (RN-022); `debt` lo
 * que el cliente debe. `net` coincide con la fórmula anterior de RN-021
 * (1.x) y con balance − debt salvo con datos históricos inconsistentes
 * (saldo aplicado sin sobrepago que lo respalde, caso RN-021-10).
 */
import { round2 } from '@/lib/order-cost';

export type BalanceItemKind = 'order' | 'delivery';

export interface BalanceItem {
  kind: BalanceItemKind;
  /** `total_costs` de la orden o `weight_cost` de la entrega. */
  cost: number;
  /** `received_value_of_client` / `payment_amount`. */
  cash: number;
  /** `balance_applied`. */
  applied: number;
}

export interface ClientBalance {
  /** Saldo a favor disponible (≥ 0). Se guarda en `CustomUser.balance`. */
  balance: number;
  /** Deuda pendiente (≥ 0). Se guarda en `CustomUser.debt`. */
  debt: number;
  /** Posición neta = Σ efectivo − Σ costo (puede ser negativa). */
  net: number;
}

export function computeClientBalance(items: readonly BalanceItem[]): ClientBalance {
  let surplus = 0;
  let applied = 0;
  let pending = 0;
  let cash = 0;
  let cost = 0;
  for (const raw of items) {
    const itemCost = round2(raw.cost);
    const itemCash = round2(raw.cash);
    const itemApplied = round2(raw.applied);
    const covered = round2(itemCash + itemApplied);
    surplus += Math.max(0, round2(covered - itemCost));
    pending += Math.max(0, round2(itemCost - covered));
    applied += itemApplied;
    cash += itemCash;
    cost += itemCost;
  }
  return {
    balance: Math.max(0, round2(surplus - applied)),
    debt: round2(pending),
    net: round2(cash - cost),
  };
}

export type ClientBalanceStatus = 'deuda' | 'favor' | 'aldia';

/**
 * Estado para badges y filtros: la deuda manda (un cliente con saldo a
 * favor y deuda a la vez tiene algo por cobrar); después el saldo a favor.
 */
export function clientBalanceStatus(b: Pick<ClientBalance, 'balance' | 'debt'>): ClientBalanceStatus {
  if (round2(b.debt) > 0) return 'deuda';
  if (round2(b.balance) > 0) return 'favor';
  return 'aldia';
}

export const CLIENT_BALANCE_STATUS_LABELS: Record<ClientBalanceStatus, string> = {
  deuda: 'DEUDA',
  favor: 'SALDO A FAVOR',
  aldia: 'AL DÍA',
};
