import { describe, expect, it } from 'vitest';
import {
  CLIENT_BALANCE_STATUS_LABELS,
  clientBalanceStatus,
  computeClientBalance,
} from './client-balance';

// RN-021 (2.0.0, ADR-0009). Los vectores compartidos con Django están en
// doc/procesos/casos/client-balance.json (spec-cases.test.ts); aquí van
// los detalles de comportamiento.
describe('RN-021 saldo a favor y deuda del cliente', () => {
  it('a surplus in one order is available while another order is unpaid (ADR-0009)', () => {
    const b = computeClientBalance([
      { kind: 'order', cost: 100, cash: 150, applied: 0 },
      { kind: 'order', cost: 50, cash: 0, applied: 0 },
    ]);
    expect(b).toEqual({ balance: 50, debt: 50, net: 0 });
    expect(clientBalanceStatus(b)).toBe('deuda');
  });

  it('applying the surplus consumes it and clears the debt', () => {
    expect(
      computeClientBalance([
        { kind: 'order', cost: 100, cash: 150, applied: 0 },
        { kind: 'order', cost: 50, cash: 0, applied: 50 },
      ])
    ).toEqual({ balance: 0, debt: 0, net: 0 });
  });

  it('never reports a negative credit even with inconsistent legacy data', () => {
    const b = computeClientBalance([{ kind: 'order', cost: 100, cash: 0, applied: 100 }]);
    expect(b.balance).toBe(0);
    expect(b.debt).toBe(0);
    expect(b.net).toBe(-100);
  });

  it('treats deliveries like orders and ignores bags', () => {
    expect(
      computeClientBalance([
        { kind: 'delivery', cost: 20, cash: 5, applied: 0 },
        { kind: 'delivery', cost: 0, cash: 0, applied: 0 },
      ])
    ).toEqual({ balance: 0, debt: 15, net: -15 });
  });

  it('rounds every amount to cents before operating', () => {
    expect(
      computeClientBalance([
        { kind: 'order', cost: 33.333, cash: 50, applied: 0 },
        { kind: 'order', cost: 10.004, cash: 0, applied: 0 },
      ])
    ).toEqual({ balance: 16.67, debt: 10, net: 6.67 });
  });

  it('status: debt wins over credit, then credit, then up to date', () => {
    expect(clientBalanceStatus({ balance: 10, debt: 5 })).toBe('deuda');
    expect(clientBalanceStatus({ balance: 10, debt: 0 })).toBe('favor');
    expect(clientBalanceStatus({ balance: 0, debt: 0 })).toBe('aldia');
    expect(clientBalanceStatus({ balance: 0.004, debt: 0.004 })).toBe('aldia');
    expect(CLIENT_BALANCE_STATUS_LABELS.deuda).toBe('DEUDA');
  });
});
