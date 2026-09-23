import { round2 } from '@/lib/order-cost';

/**
 * Documentos al cliente generados desde /users?tab=balances:
 *
 *   - `pending`: factura de lo pendiente de cobro (órdenes y entregas con
 *     saldo por pagar), con selección de partidas.
 *   - `history`: estado de cuenta tipo extracto bancario (débitos,
 *     créditos y saldo corriente), opcionalmente acotado por fechas.
 *   - `orders`: factura de pedidos concretos con sus productos.
 *
 * Módulo puro (sin Prisma) para poder testearlo. Las fórmulas siguen la
 * especificación de procesos: el pendiente de una partida es el
 * complemento de RN-020 (costo − efectivo − saldo aplicado) y el saldo
 * corriente del extracto reproduce RN-021 (efectivo − costo; el saldo
 * aplicado es informativo y no mueve el saldo), igual que
 * `get_client_operations_statement` en Django.
 */

export type StatementMode = 'pending' | 'history' | 'orders';

export const STATEMENT_MODES: readonly StatementMode[] = [
  'pending',
  'history',
  'orders',
];

export function isStatementMode(v: unknown): v is StatementMode {
  return typeof v === 'string' && (STATEMENT_MODES as string[]).includes(v);
}

export interface StatementProduct {
  id: string;
  name: string;
  shopName: string;
  amountRequested: number;
  /** Precio unitario en la tienda. */
  shopCost: number;
  /** Total de la línea (RN-001: cantidad, envío e impuestos incluidos). */
  totalCost: number;
}

export interface StatementOrder {
  id: string;
  /** ISO. */
  createdAt: string;
  /** ISO. En Django y admin-next se sella al registrar el cobro. */
  paymentDate: string;
  status: string;
  payStatus: string;
  totalCosts: number;
  received: number;
  balanceApplied: number;
  products: StatementProduct[];
}

export interface StatementDelivery {
  id: string;
  /** ISO. */
  deliverDate: string;
  /** ISO o null si nunca se cobró. */
  paymentDate: string | null;
  status: string;
  paymentStatus: string;
  weight: number;
  weightCost: number;
  received: number;
  balanceApplied: number;
  categoryName: string | null;
  productCount: number;
}

/** Complemento de RN-020: lo que falta por cubrir de una partida. */
export function pendingOf(
  cost: number,
  received: number,
  balanceApplied: number
): number {
  return Math.max(0, round2(cost - received - balanceApplied));
}

export type BalanceStatus = 'deuda' | 'favor' | 'aldia';

export function balanceStatus(balance: number): BalanceStatus {
  const b = round2(balance);
  if (b < 0) return 'deuda';
  if (b > 0) return 'favor';
  return 'aldia';
}

export const BALANCE_STATUS_LABELS: Record<BalanceStatus, string> = {
  deuda: 'Deuda',
  favor: 'Saldo a favor',
  aldia: 'Al día',
};

/* ------------------------------------------------------------------ */
/* Extracto (historial)                                                */
/* ------------------------------------------------------------------ */

export type LedgerKind =
  | 'order-cost'
  | 'order-payment'
  | 'order-balance'
  | 'delivery-cost'
  | 'delivery-payment'
  | 'delivery-balance';

export interface LedgerEntry {
  id: string;
  /** ISO. */
  date: string;
  kind: LedgerKind;
  refType: 'order' | 'delivery';
  refId: string;
  label: string;
  description: string;
  debit: number;
  credit: number;
  /** Saldo aplicado: se muestra pero no altera el saldo corriente (RN-021). */
  informational: boolean;
  /** Saldo corriente tras la operación (efectivo − costo). */
  balance: number;
}

export const LEDGER_KIND_LABELS: Record<LedgerKind, string> = {
  'order-cost': 'Pedido',
  'order-payment': 'Pago pedido',
  'order-balance': 'Saldo aplicado',
  'delivery-cost': 'Entrega',
  'delivery-payment': 'Pago entrega',
  'delivery-balance': 'Saldo aplicado',
};

type RawEntry = Omit<LedgerEntry, 'balance'>;

function orderEntries(o: StatementOrder): RawEntry[] {
  const out: RawEntry[] = [];
  if (round2(o.totalCosts) > 0) {
    out.push({
      id: `order-${o.id}-cost`,
      date: o.createdAt,
      kind: 'order-cost',
      refType: 'order',
      refId: o.id,
      label: LEDGER_KIND_LABELS['order-cost'],
      description: `Pedido #${o.id} · ${o.products.length} producto${o.products.length === 1 ? '' : 's'}`,
      debit: round2(o.totalCosts),
      credit: 0,
      informational: false,
    });
  }
  if (round2(o.received) > 0) {
    out.push({
      id: `order-${o.id}-payment`,
      date: o.paymentDate || o.createdAt,
      kind: 'order-payment',
      refType: 'order',
      refId: o.id,
      label: LEDGER_KIND_LABELS['order-payment'],
      description: `Pago del pedido #${o.id}`,
      debit: 0,
      credit: round2(o.received),
      informational: false,
    });
  }
  if (round2(o.balanceApplied) > 0) {
    out.push({
      id: `order-${o.id}-balance`,
      date: o.paymentDate || o.createdAt,
      kind: 'order-balance',
      refType: 'order',
      refId: o.id,
      label: LEDGER_KIND_LABELS['order-balance'],
      description: `Saldo a favor aplicado al pedido #${o.id}`,
      debit: round2(o.balanceApplied),
      credit: 0,
      informational: true,
    });
  }
  return out;
}

function deliveryEntries(d: StatementDelivery): RawEntry[] {
  const out: RawEntry[] = [];
  const category = d.categoryName ? ` · ${d.categoryName}` : '';
  if (round2(d.weightCost) > 0) {
    out.push({
      id: `delivery-${d.id}-cost`,
      date: d.deliverDate,
      kind: 'delivery-cost',
      refType: 'delivery',
      refId: d.id,
      label: LEDGER_KIND_LABELS['delivery-cost'],
      description: `Entrega #${d.id} · ${formatWeight(d.weight)}${category}`,
      debit: round2(d.weightCost),
      credit: 0,
      informational: false,
    });
  }
  if (round2(d.received) > 0) {
    out.push({
      id: `delivery-${d.id}-payment`,
      date: d.paymentDate ?? d.deliverDate,
      kind: 'delivery-payment',
      refType: 'delivery',
      refId: d.id,
      label: LEDGER_KIND_LABELS['delivery-payment'],
      description: `Pago de la entrega #${d.id}`,
      debit: 0,
      credit: round2(d.received),
      informational: false,
    });
  }
  if (round2(d.balanceApplied) > 0) {
    out.push({
      id: `delivery-${d.id}-balance`,
      date: d.paymentDate ?? d.deliverDate,
      kind: 'delivery-balance',
      refType: 'delivery',
      refId: d.id,
      label: LEDGER_KIND_LABELS['delivery-balance'],
      description: `Saldo a favor aplicado a la entrega #${d.id}`,
      debit: round2(d.balanceApplied),
      credit: 0,
      informational: true,
    });
  }
  return out;
}

export function formatWeight(lbs: number): string {
  return `${round2(lbs).toFixed(2)} lb`;
}

/**
 * Libro mayor completo del cliente ordenado por fecha, con saldo
 * corriente. El saldo final coincide con RN-021.
 */
export function buildLedger(
  orders: StatementOrder[],
  deliveries: StatementDelivery[]
): LedgerEntry[] {
  const raw = [
    ...orders.flatMap(orderEntries),
    ...deliveries.flatMap(deliveryEntries),
  ];
  raw.sort((a, b) => {
    const t = Date.parse(a.date) - Date.parse(b.date);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });
  let balance = 0;
  return raw.map((e) => {
    if (!e.informational) balance = round2(balance + e.credit - e.debit);
    return { ...e, balance };
  });
}

export interface DateRange {
  /** YYYY-MM-DD inclusive. */
  from?: string;
  /** YYYY-MM-DD inclusive. */
  to?: string;
}

export interface HistoryStatement {
  range: DateRange;
  openingBalance: number;
  entries: LedgerEntry[];
  totalDebits: number;
  totalCredits: number;
  totalApplied: number;
  closingBalance: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Extracto tipo cuenta bancaria. Con rango, las operaciones anteriores a
 * `from` se resumen como "saldo anterior" (opening) y solo se listan
 * las del período; sin rango es el historial completo desde cero.
 * Los límites se interpretan como días calendario UTC, igual que el
 * generador de balances por rango.
 */
export function buildHistory(
  orders: StatementOrder[],
  deliveries: StatementDelivery[],
  range: DateRange = {}
): HistoryStatement {
  const ledger = buildLedger(orders, deliveries);
  const fromMs = range.from ? Date.parse(range.from) : Number.NEGATIVE_INFINITY;
  const toMs = range.to
    ? Date.parse(range.to) + DAY_MS
    : Number.POSITIVE_INFINITY;

  let openingBalance = 0;
  const entries: LedgerEntry[] = [];
  for (const e of ledger) {
    const t = Date.parse(e.date);
    if (t < fromMs) {
      if (!e.informational) openingBalance = e.balance;
      continue;
    }
    if (t >= toMs) break;
    entries.push(e);
  }

  const totalDebits = round2(
    entries.filter((e) => !e.informational).reduce((s, e) => s + e.debit, 0)
  );
  const totalCredits = round2(entries.reduce((s, e) => s + e.credit, 0));
  const totalApplied = round2(
    entries.filter((e) => e.informational).reduce((s, e) => s + e.debit, 0)
  );
  const closingBalance = round2(openingBalance + totalCredits - totalDebits);

  return {
    range,
    openingBalance,
    entries,
    totalDebits,
    totalCredits,
    totalApplied,
    closingBalance,
  };
}

/* ------------------------------------------------------------------ */
/* Factura de pendientes                                               */
/* ------------------------------------------------------------------ */

export interface PendingLine {
  /** Clave estable para la selección en la URL: `o12` / `d7`. */
  key: string;
  refType: 'order' | 'delivery';
  refId: string;
  /** ISO. */
  date: string;
  description: string;
  detail: string;
  status: string;
  payStatus: string;
  cost: number;
  received: number;
  balanceApplied: number;
  pending: number;
}

export interface InvoiceTotals {
  cost: number;
  received: number;
  balanceApplied: number;
  pending: number;
}

export interface PendingInvoice {
  lines: PendingLine[];
  totals: InvoiceTotals;
}

export function pendingKey(refType: 'order' | 'delivery', id: string): string {
  return `${refType === 'order' ? 'o' : 'd'}${id}`;
}

function sumTotals(
  items: ReadonlyArray<{
    cost: number;
    received: number;
    balanceApplied: number;
    pending: number;
  }>
): InvoiceTotals {
  return {
    cost: round2(items.reduce((s, l) => s + l.cost, 0)),
    received: round2(items.reduce((s, l) => s + l.received, 0)),
    balanceApplied: round2(items.reduce((s, l) => s + l.balanceApplied, 0)),
    pending: round2(items.reduce((s, l) => s + l.pending, 0)),
  };
}

/** Todas las partidas con saldo por pagar, ordenadas por fecha. */
export function pendingLines(
  orders: StatementOrder[],
  deliveries: StatementDelivery[]
): PendingLine[] {
  const lines: PendingLine[] = [];
  for (const o of orders) {
    const pending = pendingOf(o.totalCosts, o.received, o.balanceApplied);
    if (pending <= 0) continue;
    lines.push({
      key: pendingKey('order', o.id),
      refType: 'order',
      refId: o.id,
      date: o.createdAt,
      description: `Pedido #${o.id}`,
      detail: `${o.products.length} producto${o.products.length === 1 ? '' : 's'}`,
      status: o.status,
      payStatus: o.payStatus,
      cost: round2(o.totalCosts),
      received: round2(o.received),
      balanceApplied: round2(o.balanceApplied),
      pending,
    });
  }
  for (const d of deliveries) {
    const pending = pendingOf(d.weightCost, d.received, d.balanceApplied);
    if (pending <= 0) continue;
    lines.push({
      key: pendingKey('delivery', d.id),
      refType: 'delivery',
      refId: d.id,
      date: d.deliverDate,
      description: `Entrega #${d.id}`,
      detail: [formatWeight(d.weight), d.categoryName].filter(Boolean).join(' · '),
      status: d.status,
      payStatus: d.paymentStatus,
      cost: round2(d.weightCost),
      received: round2(d.received),
      balanceApplied: round2(d.balanceApplied),
      pending,
    });
  }
  lines.sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  return lines;
}

/**
 * Factura de pendientes. Sin `selectedKeys` incluye todo lo pendiente;
 * con ellas, solo las partidas elegidas (claves desconocidas se ignoran).
 */
export function buildPendingInvoice(
  orders: StatementOrder[],
  deliveries: StatementDelivery[],
  selectedKeys?: readonly string[]
): PendingInvoice {
  let lines = pendingLines(orders, deliveries);
  if (selectedKeys) {
    const wanted = new Set(selectedKeys);
    lines = lines.filter((l) => wanted.has(l.key));
  }
  return { lines, totals: sumTotals(lines) };
}

/* ------------------------------------------------------------------ */
/* Factura por pedidos                                                 */
/* ------------------------------------------------------------------ */

export interface OrderInvoiceLine {
  id: string;
  name: string;
  shopName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface OrderInvoiceSection {
  order: Pick<
    StatementOrder,
    'id' | 'createdAt' | 'status' | 'payStatus'
  >;
  lines: OrderInvoiceLine[];
  cost: number;
  received: number;
  balanceApplied: number;
  pending: number;
}

export interface OrdersInvoice {
  sections: OrderInvoiceSection[];
  totals: InvoiceTotals;
}

/** Factura de los pedidos elegidos (cualquier estado de pago), con productos. */
export function buildOrdersInvoice(
  orders: StatementOrder[],
  selectedIds: readonly string[]
): OrdersInvoice {
  const wanted = new Set(selectedIds);
  const sections = orders
    .filter((o) => wanted.has(o.id))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map<OrderInvoiceSection>((o) => ({
      order: {
        id: o.id,
        createdAt: o.createdAt,
        status: o.status,
        payStatus: o.payStatus,
      },
      lines: o.products.map((p) => ({
        id: p.id,
        name: p.name,
        shopName: p.shopName,
        quantity: p.amountRequested,
        unitCost: round2(p.shopCost),
        total: round2(p.totalCost),
      })),
      cost: round2(o.totalCosts),
      received: round2(o.received),
      balanceApplied: round2(o.balanceApplied),
      pending: pendingOf(o.totalCosts, o.received, o.balanceApplied),
    }));
  return { sections, totals: sumTotals(sections) };
}

/* ------------------------------------------------------------------ */
/* Referencia del documento                                            */
/* ------------------------------------------------------------------ */

const REFERENCE_PREFIX: Record<StatementMode, string> = {
  pending: 'FP',
  history: 'EC',
  orders: 'FO',
};

export const STATEMENT_TITLES: Record<StatementMode, string> = {
  pending: 'Factura de pendientes',
  history: 'Estado de cuenta',
  orders: 'Factura por pedidos',
};

/**
 * Referencia legible y determinista (no se persiste): prefijo del tipo,
 * id del cliente y fecha de emisión. Dos emisiones del mismo documento
 * el mismo día comparten referencia a propósito.
 */
export function statementReference(
  mode: StatementMode,
  clientId: string,
  issuedAt: Date
): string {
  const y = issuedAt.getUTCFullYear();
  const m = String(issuedAt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(issuedAt.getUTCDate()).padStart(2, '0');
  return `${REFERENCE_PREFIX[mode]}-${clientId.padStart(5, '0')}-${y}${m}${d}`;
}

/** Parsea `items=o1,d2` / `orders=1,2` de la URL; descarta basura. */
export function parseCsvParam(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[od]?\d{1,19}$/.test(s));
}

export function isIsoDay(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v))
  );
}
