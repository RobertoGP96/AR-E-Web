import { describe, expect, it } from 'vitest';
import {
  BOTTOM_NAV_SLOTS,
  bottomNavItems,
  isSectionActive,
  matchSection,
  resolveBottomNav,
} from './navigation';
import { canAccessPath } from './route-roles';
import { STAFF_ROLES } from './roles';

const hrefs = (role: string) => bottomNavItems(role).map((s) => s.href);

describe('matchSection', () => {
  it('gana el href más específico', () => {
    expect(matchSection('/delivery/prepare')?.href).toBe('/delivery/prepare');
    expect(matchSection('/delivery')?.href).toBe('/delivery');
    expect(matchSection('/delivery/42')?.href).toBe('/delivery');
  });

  it('los detalles y sub-vistas cuentan como su sección', () => {
    expect(matchSection('/orders/123')?.href).toBe('/orders');
    expect(matchSection('/settings/import')?.href).toBe('/settings');
    expect(matchSection('/profile')?.href).toBe('/profile');
  });

  it('no confunde prefijos parciales ni rutas desconocidas', () => {
    expect(matchSection('/ordersx')).toBeNull();
    expect(matchSection('/search')).toBeNull();
    expect(isSectionActive('/products', '/orders')).toBe(false);
  });
});

describe('bottomNavItems', () => {
  it('cada rol recibe exactamente 4 accesos a los que puede entrar', () => {
    for (const role of STAFF_ROLES) {
      const items = hrefs(role);
      expect(items).toHaveLength(BOTTOM_NAV_SLOTS);
      expect(new Set(items).size).toBe(BOTTOM_NAV_SLOTS);
      for (const href of items) expect(canAccessPath(role, href)).toBe(true);
    }
  });

  it('refleja el trabajo diario de cada rol', () => {
    expect(hrefs('admin')).toEqual(['/dashboard', '/orders', '/products', '/delivery']);
    expect(hrefs('accountant')).toEqual(['/dashboard', '/balance', '/invoices', '/expenses']);
    expect(hrefs('logistical')).toEqual([
      '/dashboard',
      '/packages',
      '/delivery/prepare',
      '/delivery',
    ]);
  });

  it('un rol sin configuración se rellena por prioridad y RBAC', () => {
    expect(hrefs('agent')).toContain('/orders');
    expect(hrefs('agent')).not.toContain('/users');
    expect(bottomNavItems('client')).toEqual([]);
    expect(bottomNavItems(null)).toEqual([]);
  });
});

describe('resolveBottomNav', () => {
  it('sin hueco contextual cuando la ruta es un acceso fijo', () => {
    const state = resolveBottomNav('admin', '/orders/55');
    expect(state.current?.href).toBe('/orders');
    expect(state.contextual).toBeNull();
  });

  it('muestra la sección actual en el quinto hueco cuando no es fija', () => {
    expect(resolveBottomNav('admin', '/settings/data').contextual?.short).toBe(
      'Ajustes'
    );
    expect(resolveBottomNav('accountant', '/users').contextual?.short).toBe(
      'Usuarios'
    );
    expect(resolveBottomNav('admin', '/delivery/prepare').contextual?.short).toBe(
      'Preparar'
    );
    // Para logística "Preparar" es un acceso fijo: no se duplica.
    expect(resolveBottomNav('logistical', '/delivery/prepare').contextual).toBeNull();
  });

  it('ruta desconocida: nada activo y el hueco vuelve a "Más"', () => {
    const state = resolveBottomNav('admin', '/search');
    expect(state.current).toBeNull();
    expect(state.contextual).toBeNull();
  });
});
