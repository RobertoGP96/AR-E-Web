import { describe, expect, it } from 'vitest';
import { deriveAmounts } from './product-status';

describe('RN-011 deriveAmounts (Entregado solo con entrega Entregado)', () => {
  const base = { requested: 3, bought: 3, refunded: 0, received: 3 };

  it('keeps Recibido while units sit in an open bag', () => {
    const r = deriveAmounts({ ...base, deliveredAll: 3, deliveredFinal: 0 });
    expect(r.amountDelivered).toBe(3);
    expect(r.status).toBe('Recibido');
  });

  it('turns Entregado once the delivery is delivered', () => {
    expect(deriveAmounts({ ...base, deliveredAll: 3, deliveredFinal: 3 }).status).toBe('Entregado');
  });

  it('stays Recibido with a partial final delivery', () => {
    expect(deriveAmounts({ ...base, deliveredAll: 3, deliveredFinal: 2 }).status).toBe('Recibido');
  });

  it('clamps refunds and derives Encargado/Comprado', () => {
    expect(deriveAmounts({ requested: 2, bought: 1, refunded: 2, received: 0, deliveredAll: 0, deliveredFinal: 0 }))
      .toMatchObject({ amountPurchased: 0, status: 'Encargado' });
    expect(deriveAmounts({ requested: 2, bought: 2, refunded: 0, received: 0, deliveredAll: 0, deliveredFinal: 0 }).status)
      .toBe('Comprado');
  });
});
