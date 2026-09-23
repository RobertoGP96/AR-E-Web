/**
 * Gestor (`sales_manager`) de una orden — ADR-0007.
 *
 * Cualquier miembro del personal puede ser el gestor; por defecto, el
 * «admin general» (admin activo con `is_superuser` o, en su defecto, el
 * más antiguo). Espejo de `apps/admin-next/src/lib/order-manager.ts`.
 */

export const SALES_MANAGER_ROLES = ['admin', 'agent', 'accountant', 'logistical'] as const;
export type SalesManagerRole = (typeof SALES_MANAGER_ROLES)[number];

const ROLE_LABELS: Record<SalesManagerRole, string> = {
  admin: 'Admin',
  agent: 'Agente',
  accountant: 'Contador',
  logistical: 'Logístico',
};

export function isSalesManagerRole(role: string): role is SalesManagerRole {
  return (SALES_MANAGER_ROLES as readonly string[]).includes(role);
}

/** Nombre del gestor con su rol al lado (salvo para agentes). */
export function salesManagerLabel(fullName: string, role: string): string {
  const name = fullName.trim() || 'Sin nombre';
  return role === 'agent' || !isSalesManagerRole(role) ? name : `${name} · ${ROLE_LABELS[role]}`;
}

interface AdminLike {
  id: number;
  role?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

/** Admin general: superusuario activo o, en su defecto, el admin activo más antiguo. */
export function pickGeneralAdmin<T extends AdminLike>(admins: readonly T[]): T | undefined {
  return [...admins]
    .filter((a) => (a.role === undefined || a.role === 'admin') && a.is_active !== false)
    .sort((a, b) => Number(!!b.is_superuser) - Number(!!a.is_superuser) || a.id - b.id)[0];
}
