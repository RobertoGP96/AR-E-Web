import { describe, expect, it } from 'vitest';
import {
  affectsProductStatus,
  deliveryActionsFor,
  deliveryPhase,
  nextDeliveryStatus,
  phaseWhere,
} from './delivery-status';

describe('ES-entrega state machine', () => {
  it('derives the phase (open bag = En preparación)', () => {
    expect(deliveryPhase({ status: 'Pendiente', weight: 0 })).toBe('En preparación');
    expect(deliveryPhase({ status: 'Pendiente', weight: 2 })).toBe('Pendiente');
    expect(deliveryPhase({ status: 'Entregado', weight: 2 })).toBe('Entregado');
  });

  it('phaseWhere maps to prisma filters', () => {
    expect(phaseWhere('En preparación')).toEqual({ status: 'Pendiente', weight: 0 });
    expect(phaseWhere('Pendiente')).toEqual({ status: 'Pendiente', weight: { gt: 0 } });
    expect(phaseWhere('Fallida')).toEqual({ status: 'Fallida' });
  });

  it('blocks every action on an open bag', () => {
    const bag = { status: 'Pendiente', weight: 0, productCount: 3 };
    expect(nextDeliveryStatus(bag, 'dispatch', 'admin').ok).toBe(false);
    expect(deliveryActionsFor(bag, 'admin')).toEqual([]);
  });

  it('dispatches and delivers weighed deliveries with products', () => {
    const d = { status: 'Pendiente', weight: 1.5, productCount: 2 };
    expect(nextDeliveryStatus(d, 'dispatch', 'logistical')).toEqual({ ok: true, to: 'En transito' });
    expect(nextDeliveryStatus(d, 'deliver', 'logistical')).toEqual({ ok: true, to: 'Entregado' });
    expect(nextDeliveryStatus({ ...d, productCount: 0 }, 'dispatch', 'admin').ok).toBe(false);
  });

  it('fails and retries only from the right states', () => {
    expect(nextDeliveryStatus({ status: 'En transito', weight: 1, productCount: 1 }, 'fail', 'logistical').ok).toBe(true);
    expect(nextDeliveryStatus({ status: 'Pendiente', weight: 1, productCount: 1 }, 'fail', 'logistical').ok).toBe(false);
    expect(nextDeliveryStatus({ status: 'Fallida', weight: 1, productCount: 1 }, 'retry', 'logistical')).toEqual({ ok: true, to: 'En transito' });
  });

  it('reopens only for admin', () => {
    const d = { status: 'Entregado', weight: 1, productCount: 1 };
    expect(nextDeliveryStatus(d, 'reopen', 'admin')).toEqual({ ok: true, to: 'Pendiente' });
    expect(nextDeliveryStatus(d, 'reopen', 'logistical').ok).toBe(false);
    expect(deliveryActionsFor(d, 'logistical')).toEqual([]);
  });

  it('flags transitions that change product status', () => {
    expect(affectsProductStatus('En transito', 'Entregado')).toBe(true);
    expect(affectsProductStatus('Entregado', 'Pendiente')).toBe(true);
    expect(affectsProductStatus('Pendiente', 'En transito')).toBe(false);
  });
});
