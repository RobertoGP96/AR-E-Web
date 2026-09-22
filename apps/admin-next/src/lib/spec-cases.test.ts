/**
 * Tests de conformidad con la especificación de procesos
 * (doc/procesos/). Cada archivo de doc/procesos/casos/*.json es un
 * vector de prueba compartido con Django (backend/api/tests/
 * test_spec_cases.py): la misma entrada debe producir la misma salida
 * en ambos escritores de la base de datos.
 *
 * Reglas cubiertas: RN-001 (costo de producto), RN-010 / RN-011
 * (estado de producto derivado), RN-020 (estado de pago).
 */
import { describe, expect, it } from 'vitest';
import productStatusCases from '../../../../doc/procesos/casos/product-status.json';
import productCostCases from '../../../../doc/procesos/casos/product-cost.json';
import payStatusCases from '../../../../doc/procesos/casos/pay-status.json';
import {
  computePayStatus,
  computeProductCost,
  deriveProductStatus,
} from '@/lib/order-cost';

interface ProductStatusCase {
  id: string;
  regla: string;
  descripcion: string;
  input: {
    amountRequested: number;
    amountPurchased: number;
    amountReceived: number;
    amountDelivered: number;
    /** RN-011: unidades en entregas con estado Entregado. */
    amountDeliveredFinal?: number;
  };
  expected: string;
}

interface ProductCostCase {
  id: string;
  regla: string;
  descripcion: string;
  input: {
    shopCost: number;
    amountRequested: number;
    shopDeliveryCost: number;
    shopTaxes: number;
    chargeIva: boolean;
    addedTaxes: number;
    ownTaxes: number;
  };
  expected: { baseTax: number; shopTaxAmount: number; totalCost: number };
}

interface PayStatusCase {
  id: string;
  regla: string;
  descripcion: string;
  input: {
    totalCosts: number;
    receivedValueOfClient: number;
    balanceApplied: number;
  };
  expected: string;
}

const statusCases = productStatusCases as ProductStatusCase[];
const costCases = productCostCases as ProductCostCase[];
const payCases = payStatusCases as PayStatusCase[];

describe('RN-010 / RN-011 estado de producto derivado (casos/product-status.json)', () => {
  it('tiene al menos 10 casos', () => {
    expect(statusCases.length).toBeGreaterThanOrEqual(10);
  });

  it.each(statusCases.map((c) => [c.id, c] as const))(
    '%s',
    (_id, c) => {
      // RN-011: para el estado solo cuentan las unidades en entregas
      // Entregado. Si el caso no las distingue, todas cuentan (RN-010).
      const delivered = c.input.amountDeliveredFinal ?? c.input.amountDelivered;
      const status = deriveProductStatus(
        c.input.amountRequested,
        c.input.amountPurchased,
        c.input.amountReceived,
        delivered
      );
      expect(status, c.descripcion).toBe(c.expected);
    }
  );
});

describe('RN-001 costo de producto (casos/product-cost.json)', () => {
  it('tiene al menos 6 casos', () => {
    expect(costCases.length).toBeGreaterThanOrEqual(6);
  });

  it.each(costCases.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const cost = computeProductCost(c.input);
    expect(cost.baseTax, `${c.id} baseTax`).toBe(c.expected.baseTax);
    expect(cost.shopTaxAmount, `${c.id} shopTaxAmount`).toBe(
      c.expected.shopTaxAmount
    );
    expect(cost.totalCost, `${c.id} totalCost`).toBe(c.expected.totalCost);
  });
});

describe('RN-020 estado de pago (casos/pay-status.json)', () => {
  it('tiene al menos 6 casos', () => {
    expect(payCases.length).toBeGreaterThanOrEqual(6);
  });

  it.each(payCases.map((c) => [c.id, c] as const))('%s', (_id, c) => {
    const status = computePayStatus(
      c.input.totalCosts,
      c.input.receivedValueOfClient,
      c.input.balanceApplied
    );
    expect(status, c.descripcion).toBe(c.expected);
  });
});
