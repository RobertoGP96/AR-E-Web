/**
 * Gestor (`sales_manager`) de una orden — módulo PURO (sin imports).
 *
 * ADR-0007: cualquier miembro del personal (admin, agente, contador o
 * logístico) puede ser el gestor de una orden. Un agente siempre crea
 * y edita sus órdenes a su propio nombre; para el resto, si el
 * formulario no indica gestor se asigna el «admin general»
 * (`getGeneralAdminId` en `general-admin.ts`).
 */

export const SALES_MANAGER_ROLES = ['admin', 'agent', 'accountant', 'logistical'] as const;
export type SalesManagerRole = (typeof SALES_MANAGER_ROLES)[number];

export const SALES_MANAGER_ROLE_LABELS: Record<SalesManagerRole, string> = {
  admin: 'Admin',
  agent: 'Agente',
  accountant: 'Contador',
  logistical: 'Logístico',
};

export function isSalesManagerRole(role: string): role is SalesManagerRole {
  return (SALES_MANAGER_ROLES as readonly string[]).includes(role);
}

/** Etiqueta de un miembro del personal para los selectores de gestor. */
export function salesManagerLabel(fullName: string, role: string): string {
  const name = fullName.trim() || 'Sin nombre';
  return role === 'agent' || !isSalesManagerRole(role)
    ? name
    : `${name} · ${SALES_MANAGER_ROLE_LABELS[role]}`;
}

export interface ResolveSalesManagerInput {
  /** Rol de quien crea o edita la orden. */
  creatorRole: string;
  creatorId: string;
  /** Gestor pedido en el formulario (id) o vacío/null. */
  requested: string | null | undefined;
  /** Id del admin general, si existe alguno activo. */
  generalAdminId: string | null;
}

/**
 * Decide el gestor de la orden (ADR-0007):
 * - agente → él mismo, ignorando el formulario;
 * - resto → el gestor pedido; si no hay, el admin general; si tampoco, null.
 */
export function resolveSalesManagerId({
  creatorRole,
  creatorId,
  requested,
  generalAdminId,
}: ResolveSalesManagerInput): string | null {
  if (creatorRole === 'agent') return creatorId;
  const wanted = requested && requested.length > 0 ? requested : null;
  return wanted ?? generalAdminId ?? null;
}
