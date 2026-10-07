'use server';

import { requireRole, parseId, ROLES } from '@/lib/action-helpers';
import { computeClientBalance } from '@/lib/client-balance';
import { loadClientStatementData } from '@/lib/client-statement-data';
import {
  buildLedger,
  pendingLines,
  pendingOf,
  toBalanceItems,
  type PendingLine,
} from '@/lib/client-statement';

export interface InvoiceOrderOption {
  id: string;
  createdAt: string;
  status: string;
  payStatus: string;
  productCount: number;
  cost: number;
  received: number;
  balanceApplied: number;
  pending: number;
}

export interface ClientInvoiceOptions {
  client: { id: string; name: string; phoneNumber: string };
  /** Saldo a favor en vivo (RN-021 2.0.0, ≥ 0). */
  balance: number;
  /** Deuda pendiente en vivo (≥ 0). */
  debt: number;
  /** Posición neta = Σ efectivo − Σ costo. */
  net: number;
  /** Partidas con saldo por pagar (órdenes y entregas). */
  pending: PendingLine[];
  /** Todas las órdenes del cliente para la factura por pedidos. */
  orders: InvoiceOrderOption[];
  /** Fecha de la primera y última operación, para acotar el extracto. */
  firstDate: string | null;
  lastDate: string | null;
  operationCount: number;
}

export type ClientInvoiceOptionsResult =
  | { ok: true; data: ClientInvoiceOptions }
  | { ok: false; error: string };

/**
 * Datos para el diálogo "Generar factura" de /users?tab=balances: qué hay
 * pendiente, qué pedidos existen y el rango de fechas con movimientos.
 * Solo lectura; el documento en sí lo renderiza
 * /users/[id]/statement con los parámetros elegidos.
 */
export async function loadClientInvoiceOptionsAction(
  clientId: string
): Promise<ClientInvoiceOptionsResult> {
  const { denied } = await requireRole(ROLES.finance);
  if (denied) return { ok: false, error: denied.error };

  const id = parseId(clientId);
  if (!id) return { ok: false, error: 'Cliente inválido' };

  const data = await loadClientStatementData(id);
  if (!data) return { ok: false, error: 'Cliente no encontrado' };

  const ledger = buildLedger(data.orders, data.deliveries);
  // RN-021 2.0.0: saldo a favor y deuda por partidas (no el saldo corriente del extracto).
  const live = computeClientBalance(toBalanceItems(data.orders, data.deliveries));

  return {
    ok: true,
    data: {
      client: {
        id: data.client.id,
        name: data.client.name,
        phoneNumber: data.client.phoneNumber,
      },
      balance: live.balance,
      debt: live.debt,
      net: live.net,
      pending: pendingLines(data.orders, data.deliveries),
      orders: data.orders.map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        payStatus: o.payStatus,
        productCount: o.products.length,
        cost: o.totalCosts,
        received: o.received,
        balanceApplied: o.balanceApplied,
        pending: pendingOf(o.totalCosts, o.received, o.balanceApplied),
      })),
      firstDate: ledger[0]?.date ?? null,
      lastDate: ledger.at(-1)?.date ?? null,
      operationCount: ledger.length,
    },
  };
}
