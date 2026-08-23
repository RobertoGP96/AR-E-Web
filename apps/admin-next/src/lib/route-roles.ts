import { ROLES, STAFF_ROLES } from '@/lib/action-helpers';

/**
 * Page-level RBAC: first path segment → roles that may open it.
 * Mirrors roleAllowedRoutes in apps/admin/src/routes/role-config.ts.
 * Enforced in proxy.ts (edge) and again in (admin)/layout.tsx.
 */
const ROUTE_ROLES: Record<string, readonly string[]> = {
  dashboard: STAFF_ROLES,
  users: ROLES.users,
  shops: ROLES.shops,
  categories: ROLES.categories,
  purchases: ROLES.purchases,
  orders: ROLES.orders,
  // Agents can view deliveries (read-only actions server-side).
  delivery: ['admin', 'agent', 'logistical'],
  packages: ROLES.packages,
  balance: ROLES.finance,
  invoices: ROLES.finance,
  expenses: ROLES.finance,
  analytics: ROLES.finance,
  settings: STAFF_ROLES,
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
  const segment = pathname.split('/')[1] ?? '';
  const allowed = ROUTE_ROLES[segment];
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
