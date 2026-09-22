import { describe, expect, it } from 'vitest';
import { appendRefundNote, canRefund, canRemoveBuyed } from './purchase-rules';

const product = { name: 'Zapatos', amountPurchased: 5, amountReceived: 3 };

describe('INV-001 purchase rules', () => {
  it('allows removing a row when received units stay covered', () => {
    expect(canRemoveBuyed(product, { amountBuyed: 2, quantityRefuned: 0 })).toBeNull();
  });

  it('blocks removing a row that would leave purchased < received', () => {
    expect(
      canRemoveBuyed(product, { amountBuyed: 3, quantityRefuned: 0 })
    ).toMatch(/1 unidad\(es\)/);
  });

  it('ignores already refunded units when removing', () => {
    expect(canRemoveBuyed(product, { amountBuyed: 3, quantityRefuned: 1 })).toBeNull();
  });

  it('caps refunds at refundable units and received units', () => {
    const row = { amountBuyed: 5, quantityRefuned: 1 };
    expect(canRefund(product, row, 5)).toMatch(/Solo quedan 4/);
    expect(canRefund(product, row, 3)).toMatch(/ya fueron recibidas/);
    expect(canRefund(product, row, 2)).toBeNull();
  });

  it('appends dated refund notes and enforces the limit', () => {
    const date = new Date(2026, 8, 22);
    const first = appendRefundNote(null, 'caja rota', 2, 10, date);
    expect(first).toEqual({ ok: true, value: '22/09/2026 · 2 ud · $10.00: caja rota' });
    const second = appendRefundNote(
      first.ok ? first.value : null,
      '',
      1,
      5,
      date
    );
    expect(second.ok && second.value).toContain('\n22/09/2026 · 1 ud · $5.00');
    expect(appendRefundNote('x'.repeat(490), 'y', 1, 1, date).ok).toBe(false);
  });
});
