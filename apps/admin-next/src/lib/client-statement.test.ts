/**
 * Documentos al cliente (factura de pendientes, estado de cuenta,
 * factura por pedidos). El saldo corriente del extracto debe coincidir
 * con RN-021 y el pendiente de cada partida con el complemento de
 * RN-020; el saldo aplicado es informativo (RN-022).
 */
import { describe, expect, it } from 'vitest';
import {
  buildHistory,
  buildLedger,
  buildOrdersInvoice,
  buildPendingInvoice,
  parseCsvParam,
  pendingOf,
  statementReference,
  type StatementDelivery,
  type StatementOrder,
} from './client-statement';

function order(partial: Partial<StatementOrder> & { id: string }): StatementOrder {
  return {
    createdAt: '2026-09-01T10:00:00.000Z',
    paymentDate: '2026-09-01T10:00:00.000Z',
    status: 'Encargado',
    payStatus: 'No pagado',
    totalCosts: 0,
    received: 0,
    balanceApplied: 0,
    products: [],
    ...partial,
  };
}

function delivery(
  partial: Partial<StatementDelivery> & { id: string }
): StatementDelivery {
  return {
    deliverDate: '2026-09-05T10:00:00.000Z',
    paymentDate: null,
    status: 'Entregado',
    paymentStatus: 'No pagado',
    weight: 2,
    weightCost: 0,
    received: 0,
    balanceApplied: 0,
    categoryName: 'Ropa',
    productCount: 1,
    ...partial,
  };
}

describe('pendingOf (complemento de RN-020)', () => {
  it('resta efectivo y saldo aplicado y nunca es negativo', () => {
    expect(pendingOf(100, 30, 20)).toBe(50);
    expect(pendingOf(100, 150, 0)).toBe(0);
    expect(pendingOf(0, 0, 0)).toBe(0);
  });
});

describe('buildLedger (RN-021)', () => {
  it('produce saldo corriente = efectivo − costo y deja el saldo aplicado como informativo', () => {
    // Ejemplo de reglas/pagos.md: A costo 100 pagado 150 → +50;
    // B costo 50 cubierto con saldo 50 → balance 0.
    const orders = [
      order({
        id: '1',
        createdAt: '2026-09-01T10:00:00.000Z',
        paymentDate: '2026-09-02T10:00:00.000Z',
        totalCosts: 100,
        received: 150,
        payStatus: 'Pagado',
      }),
      order({
        id: '2',
        createdAt: '2026-09-03T10:00:00.000Z',
        paymentDate: '2026-09-04T10:00:00.000Z',
        totalCosts: 50,
        balanceApplied: 50,
        payStatus: 'Pagado',
      }),
    ];
    const ledger = buildLedger(orders, []);
    expect(ledger.map((e) => [e.kind, e.balance])).toEqual([
      ['order-cost', -100],
      ['order-payment', 50],
      ['order-cost', 0],
      ['order-balance', 0],
    ]);
    expect(ledger[3].informational).toBe(true);
    expect(ledger.at(-1)?.balance).toBe(0);
  });

  it('omite partidas sin costo (bolsas) y ordena por fecha mezclando órdenes y entregas', () => {
    const ledger = buildLedger(
      [order({ id: '1', createdAt: '2026-09-10T00:00:00.000Z', totalCosts: 10 })],
      [
        delivery({ id: '7', deliverDate: '2026-09-05T00:00:00.000Z', weight: 0, weightCost: 0 }),
        delivery({ id: '8', deliverDate: '2026-09-01T00:00:00.000Z', weightCost: 4, received: 4, paymentDate: '2026-09-02T00:00:00.000Z' }),
      ]
    );
    expect(ledger.map((e) => e.id)).toEqual([
      'delivery-8-cost',
      'delivery-8-payment',
      'order-1-cost',
    ]);
    expect(ledger.at(-1)?.balance).toBe(-10);
  });
});

describe('buildHistory (extracto por rango)', () => {
  const orders = [
    order({ id: '1', createdAt: '2026-08-01T00:00:00.000Z', totalCosts: 100, received: 100, paymentDate: '2026-08-02T00:00:00.000Z', payStatus: 'Pagado' }),
    order({ id: '2', createdAt: '2026-09-10T00:00:00.000Z', totalCosts: 40 }),
    order({ id: '3', createdAt: '2026-10-01T00:00:00.000Z', totalCosts: 5 }),
  ];
  const deliveries = [
    delivery({ id: '9', deliverDate: '2026-09-15T12:00:00.000Z', weightCost: 20, received: 30, paymentDate: '2026-09-30T23:30:00.000Z', paymentStatus: 'Pagado' }),
  ];

  it('sin rango arranca en cero y cierra en el balance RN-021', () => {
    const h = buildHistory(orders, deliveries);
    expect(h.openingBalance).toBe(0);
    expect(h.entries).toHaveLength(6);
    expect(h.totalDebits).toBe(165);
    expect(h.totalCredits).toBe(130);
    expect(h.closingBalance).toBe(-35);
  });

  it('con rango resume lo anterior como saldo inicial e incluye el día final completo', () => {
    const h = buildHistory(orders, deliveries, { from: '2026-09-01', to: '2026-09-30' });
    expect(h.openingBalance).toBe(0); // agosto: 100 − 100
    expect(h.entries.map((e) => e.id)).toEqual([
      'order-2-cost',
      'delivery-9-cost',
      'delivery-9-payment',
    ]);
    expect(h.totalDebits).toBe(60);
    expect(h.totalCredits).toBe(30);
    expect(h.closingBalance).toBe(-30);
  });

  it('el saldo inicial arrastra la deuda previa', () => {
    const h = buildHistory(orders, deliveries, { from: '2026-10-01' });
    expect(h.openingBalance).toBe(-30);
    expect(h.entries.map((e) => e.id)).toEqual(['order-3-cost']);
    expect(h.closingBalance).toBe(-35);
  });
});

describe('buildPendingInvoice', () => {
  const orders = [
    order({ id: '1', totalCosts: 100, received: 100, payStatus: 'Pagado' }),
    order({ id: '2', createdAt: '2026-09-02T00:00:00.000Z', totalCosts: 80, received: 30, payStatus: 'Parcial' }),
    order({ id: '3', totalCosts: 0 }),
  ];
  const deliveries = [
    delivery({ id: '5', weightCost: 12.5 }),
    delivery({ id: '6', weightCost: 0, weight: 0 }),
  ];

  it('incluye solo partidas con pendiente > 0 y suma totales', () => {
    const inv = buildPendingInvoice(orders, deliveries);
    expect(inv.lines.map((l) => l.key)).toEqual(['o2', 'd5']);
    expect(inv.totals).toEqual({
      cost: 92.5,
      received: 30,
      balanceApplied: 0,
      pending: 62.5,
    });
  });

  it('respeta la selección e ignora claves desconocidas', () => {
    const inv = buildPendingInvoice(orders, deliveries, ['d5', 'o1', 'zzz']);
    expect(inv.lines.map((l) => l.key)).toEqual(['d5']);
    expect(inv.totals.pending).toBe(12.5);
  });
});

describe('buildOrdersInvoice', () => {
  it('lista los productos de los pedidos elegidos con totales por pedido', () => {
    const orders = [
      order({
        id: '4',
        totalCosts: 21.4,
        received: 10,
        balanceApplied: 1.4,
        products: [
          { id: 'p1', name: 'Camisa', shopName: 'Shein', amountRequested: 2, shopCost: 10, totalCost: 21.4 },
        ],
      }),
      order({ id: '5', totalCosts: 3 }),
    ];
    const inv = buildOrdersInvoice(orders, ['4']);
    expect(inv.sections).toHaveLength(1);
    expect(inv.sections[0].lines[0]).toMatchObject({ quantity: 2, unitCost: 10, total: 21.4 });
    expect(inv.sections[0].pending).toBe(10);
    expect(inv.totals).toEqual({ cost: 21.4, received: 10, balanceApplied: 1.4, pending: 10 });
  });
});

describe('helpers de URL', () => {
  it('statementReference es determinista por tipo, cliente y día', () => {
    const at = new Date('2026-09-23T15:00:00.000Z');
    expect(statementReference('pending', '12', at)).toBe('FP-00012-20260923');
    expect(statementReference('history', '12', at)).toBe('EC-00012-20260923');
    expect(statementReference('orders', '123456', at)).toBe('FO-123456-20260923');
  });

  it('parseCsvParam descarta valores no válidos', () => {
    expect(parseCsvParam('o1, d2,x,3,<script>')).toEqual(['o1', 'd2', '3']);
    expect(parseCsvParam(undefined)).toEqual([]);
  });
});
