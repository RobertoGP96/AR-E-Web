/**
 * Tablas de roles del panel — módulo PURO (sin imports). Lo consumen
 * tanto el servidor (guards de las server actions) como componentes
 * cliente (navegación, RBAC de rutas). Nunca importar aquí `@/auth`,
 * Prisma ni nada de Node: cualquier import arrastraría el driver de
 * base de datos al bundle del navegador.
 *
 * Los conjuntos reflejan apps/admin/src/routes/role-config.ts (el admin
 * Vite), que es la fuente de verdad del RBAC del sistema.
 */

export const STAFF_ROLES = [
  'admin',
  'agent',
  'accountant',
  'logistical',
] as const;

export const ROLES = {
  users: ['admin'],
  shops: ['admin'],
  categories: ['admin'],
  purchases: ['admin'],
  orders: ['admin', 'agent'],
  delivery: ['admin', 'logistical'],
  packages: ['admin', 'logistical'],
  finance: ['admin', 'accountant'], // balance, invoices, expenses, settings
} as const satisfies Record<string, readonly string[]>;
