import { describe, expect, it } from 'vitest';
import {
  round2,
  computeProductCost,
  computePayStatus,
  deriveProductStatus,
} from './order-cost';

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10)).toBe(10);
    expect(round2(-1.005)).toBe(-1);
  });
});

describe('computeProductCost', () => {
  it('computes the plain cascade without IVA or taxes', () => {
    const cost = computeProductCost({
      shopCost: 10,
      amountRequested: 2,
      shopDeliveryCost: 5,
      shopTaxes: 0,
      chargeIva: false,
      addedTaxes: 0,
      ownTaxes: 0,
    });
    expect(cost).toEqual({
      baseTax: 0,
      shopTaxAmount: 0,
      ownTaxes: 0,
      addedTaxes: 0,
      totalCost: 25,
    });
  });

  it('applies 7% IVA on base, then the shop tax on base + IVA', () => {
    const cost = computeProductCost({
      shopCost: 10,
      amountRequested: 2,
      shopDeliveryCost: 5,
      shopTaxes: 10,
      chargeIva: true,
      addedTaxes: 1,
      ownTaxes: 2,
    });
    // base = 25; baseTax = 1.75; shopTaxAmount = 26.75 * 0.10 = 2.675
    // total = 25 + 1.75 + 2.675 + 1 + 2 = 32.425. In binary floating
    // point that is 32.4249…, so it rounds to 32.42 — same result as
    // Python's round() in Django's Product.save().
    expect(cost.baseTax).toBe(1.75);
    expect(cost.shopTaxAmount).toBe(2.68);
    expect(cost.totalCost).toBe(32.42);
  });

  it('handles zero amounts', () => {
    const cost = computeProductCost({
      shopCost: 0,
      amountRequested: 1,
      shopDeliveryCost: 0,
      shopTaxes: 50,
      chargeIva: true,
      addedTaxes: 0,
      ownTaxes: 0,
    });
    expect(cost.totalCost).toBe(0);
  });
});

describe('computePayStatus', () => {
  it('is Pagado when total paid covers a positive cost', () => {
    expect(computePayStatus(100, 100, 0)).toBe('Pagado');
    expect(computePayStatus(100, 60, 40)).toBe('Pagado');
    expect(computePayStatus(100, 150, 0)).toBe('Pagado');
  });

  it('is Parcial for partial payment', () => {
    expect(computePayStatus(100, 50, 0)).toBe('Parcial');
    expect(computePayStatus(100, 0, 1)).toBe('Parcial');
  });

  it('is No pagado with nothing paid', () => {
    expect(computePayStatus(100, 0, 0)).toBe('No pagado');
    expect(computePayStatus(0, 0, 0)).toBe('No pagado');
  });

  it('never reports Pagado for a zero-cost order (Django rule tc > 0)', () => {
    expect(computePayStatus(0, 10, 0)).toBe('Parcial');
  });

  it('applies 2-decimal rounding before comparing', () => {
    // 0.1 + 0.2 floating point noise must still count as paid.
    expect(computePayStatus(0.3, 0.1, 0.2)).toBe('Pagado');
  });
});

describe('deriveProductStatus', () => {
  it('starts as Encargado', () => {
    expect(deriveProductStatus(3, 0, 0, 0)).toBe('Encargado');
    expect(deriveProductStatus(3, 2, 0, 0)).toBe('Encargado'); // partial buy
  });

  it('is Comprado once fully purchased but not fully received', () => {
    expect(deriveProductStatus(3, 3, 0, 0)).toBe('Comprado');
    expect(deriveProductStatus(3, 3, 2, 0)).toBe('Comprado');
  });

  it('is Recibido once fully received but not fully delivered', () => {
    expect(deriveProductStatus(3, 3, 3, 0)).toBe('Recibido');
    expect(deriveProductStatus(3, 3, 3, 2)).toBe('Recibido');
  });

  it('is Entregado once everything is delivered', () => {
    expect(deriveProductStatus(3, 3, 3, 3)).toBe('Entregado');
  });

  it('falls back to Encargado after a full refund', () => {
    expect(deriveProductStatus(3, 0, 0, 0)).toBe('Encargado');
  });
});
