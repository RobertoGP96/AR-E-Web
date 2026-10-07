/**
 * RN-023 — redistribución de sobrepago (doc/procesos/reglas/pagos.md,
 * ADR-0008). Los vectores compartidos con Django están en
 * spec-cases.test.ts; aquí van los detalles de la función.
 */
import { describe, expect, it } from 'vitest';
import {
  movableSurplus,
  planSurplusDistribution,
  sortSurplusTargets,
} from './surplus';

describe('RN-023 movableSurplus', () => {
  it('es el exceso sobre el costo', () => {
    expect(movableSurplus(8.63, 46.43, 0)).toBe(37.8);
  });
  it('nunca supera el efectivo: el saldo aplicado no se mueve (RN-022)', () => {
    // costo 100 cubierto con 100 de saldo y 20 de efectivo: solo 20 son movibles.
    expect(movableSurplus(100, 20, 100)).toBe(20);
  });
  it('es 0 sin sobrepago', () => {
    expect(movableSurplus(100, 100, 0)).toBe(0);
    expect(movableSurplus(100, 50, 0)).toBe(0);
    expect(movableSurplus(0, 0, 0)).toBe(0);
  });
});

describe('RN-023 sortSurplusTargets', () => {
  it('ordena por fecha, luego orden antes que entrega, luego id numérico', () => {
    const sorted = sortSurplusTargets([
      { kind: 'delivery', id: '3', pending: 1, date: '2026-01-02T00:00:00Z' },
      { kind: 'order', id: '10', pending: 1, date: '2026-01-02T00:00:00Z' },
      { kind: 'order', id: '9', pending: 1, date: '2026-01-02T00:00:00Z' },
      { kind: 'delivery', id: '1', pending: 1, date: '2026-01-01T00:00:00Z' },
    ]);
    expect(sorted.map((t) => `${t.kind}:${t.id}`)).toEqual([
      'delivery:1',
      'order:9',
      'order:10',
      'delivery:3',
    ]);
  });
});

describe('RN-023 planSurplusDistribution', () => {
  it('no muta la lista de entrada', () => {
    const targets = [
      { kind: 'order' as const, id: '2', pending: 5, date: '2026-01-02T00:00:00Z' },
      { kind: 'order' as const, id: '1', pending: 5, date: '2026-01-01T00:00:00Z' },
    ];
    planSurplusDistribution(10, targets);
    expect(targets[0].id).toBe('2');
  });
  it('la suma de asignaciones más el resto es el exceso', () => {
    const plan = planSurplusDistribution(37.8, [
      { kind: 'order', id: '63', pending: 29.19, date: '2026-09-23T13:10:00Z' },
      { kind: 'delivery', id: '26', pending: 6.86, date: '2026-09-23T15:00:00Z' },
      { kind: 'delivery', id: '27', pending: 1.75, date: '2026-09-30T00:00:00Z' },
    ]);
    const total = plan.allocations.reduce((s, a) => s + a.amount, 0);
    expect(Math.round((total + plan.remaining) * 100) / 100).toBe(37.8);
    expect(plan.remaining).toBe(0);
  });
});
