import { describe, expect, it } from 'vitest';
import {
  SALES_MANAGER_ROLES,
  isSalesManagerRole,
  resolveSalesManagerId,
  salesManagerLabel,
} from './order-manager';

// ADR-0007: gestor de la orden = cualquier miembro del personal; el
// admin general por defecto; el agente siempre a su propio nombre.
describe('ADR-0007 sales manager of an order', () => {
  it('accepts every staff role and rejects clients', () => {
    expect([...SALES_MANAGER_ROLES]).toEqual(['admin', 'agent', 'accountant', 'logistical']);
    for (const role of SALES_MANAGER_ROLES) expect(isSalesManagerRole(role)).toBe(true);
    expect(isSalesManagerRole('client')).toBe(false);
    expect(isSalesManagerRole('user')).toBe(false);
    expect(isSalesManagerRole('')).toBe(false);
  });

  it('an agent always manages their own orders, whatever the form says', () => {
    expect(
      resolveSalesManagerId({ creatorRole: 'agent', creatorId: '7', requested: '3', generalAdminId: '1' })
    ).toBe('7');
    expect(
      resolveSalesManagerId({ creatorRole: 'agent', creatorId: '7', requested: null, generalAdminId: null })
    ).toBe('7');
  });

  it('admin keeps the requested staff member', () => {
    expect(
      resolveSalesManagerId({ creatorRole: 'admin', creatorId: '1', requested: '12', generalAdminId: '1' })
    ).toBe('12');
  });

  it('falls back to the general admin when the form is empty', () => {
    expect(
      resolveSalesManagerId({ creatorRole: 'admin', creatorId: '2', requested: '', generalAdminId: '1' })
    ).toBe('1');
    expect(
      resolveSalesManagerId({ creatorRole: 'admin', creatorId: '2', requested: undefined, generalAdminId: '1' })
    ).toBe('1');
  });

  it('is null only when there is no general admin either', () => {
    expect(
      resolveSalesManagerId({ creatorRole: 'admin', creatorId: '2', requested: null, generalAdminId: null })
    ).toBeNull();
  });

  it('labels non-agent staff with their role', () => {
    expect(salesManagerLabel('Ana Ruiz', 'agent')).toBe('Ana Ruiz');
    expect(salesManagerLabel('Luis Paz', 'accountant')).toBe('Luis Paz · Contador');
    expect(salesManagerLabel('Eva Sol', 'logistical')).toBe('Eva Sol · Logístico');
    expect(salesManagerLabel('Root', 'admin')).toBe('Root · Admin');
    expect(salesManagerLabel('  ', 'admin')).toBe('Sin nombre · Admin');
  });
});
