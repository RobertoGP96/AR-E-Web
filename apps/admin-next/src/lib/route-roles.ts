import { ROLES, STAFF_ROLES } from '@/lib/action-helpers';

/**
 * Page-level RBAC: path prefix → roles that may open it. Keys are the
 * first segment, or "first/second" for settings sub-views (the more
 * specific key wins). Mirrors roleAllowedRoutes in
 * apps/admin/src/routes/role-config.ts.
 * Enforced in proxy.ts (edge) and again in (admin)/layout.tsx.
 */
const ROUTE_ROLES: Record<string, readonly string[]> = {
  dashboard: STAFF_ROLES,
  // Accountants only reach the "Balances" tab (the page enforces it);
  // user management writes stay admin-only via ROLES.users.
  users: ['admin', 'accountant'],
  shops: ROLES.shops,
  import: ['admin'],
  categories: ROLES.categories,
  purchases: ROLES.purchases,
  orders: ROLES.orders,
  products: ['admin', 'agent', 'logistical'],
  // Redirect legado hacia /users?tab=balances.
  'client-balances': ROLES.finance,
  // Agents can view deliveries (read-only actions server-side).
  delivery: ['admin', 'agent', 'logistical'],
  packages: ROLES.packages,
  balance: ROLES.finance,
  invoices: ROLES.finance,
  expenses: ROLES.finance,
  analytics: ROLES.finance,
  settings: STAFF_ROLES,
  'settings/data': ROLES.finance,
  'settings/import': ['admin'],
  'settings/cleanup': ['admin'],
  'settings/system': ['admin'],
  profile: STAFF_ROLES,
};

export function isStaff(role: string | undefined | null): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}

export function canAccessPath(
  role: string | undefined | null,
  pathname: string
): boolean {
  if (!isStaff(role)) return false;
  const segments = pathname.split('/').filter(Boolean);
  const nested = segments.slice(0, 2).join('/');
  const allowed = ROUTE_ROLES[nested] ?? ROUTE_ROLES[segments[0] ?? ''];
  // Unknown admin-area paths default to staff-only.
  if (!allowed) return true;
  return allowed.includes(role as string);
}

export interface NavItem {
  href: string;
  label: string;
}

export function visibleNavItems(
  items: readonly NavItem[],
  role: string | undefined | null
): NavItem[] {
  return items.filter((item) => canAccessPath(role, item.href));
}
