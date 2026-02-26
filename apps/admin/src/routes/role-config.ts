// src/config/roleConfig.ts

export type UserRole = "client" | "agent" | "accountant" | "logistical" | "admin";

export const roleLabels: Record<UserRole, string> = {
  client: "Cliente",
  agent: "Agente",
  accountant: "Contador",
  logistical: "Logístico",
  admin: "Administrador",
};

/**
 * Define qué rutas (href) puede acceder cada rol.
 * El admin tiene acceso a todo — no necesita lista, se maneja aparte.
 */
export const roleAllowedRoutes: Record<Exclude<UserRole, "admin">, string[]> = {
  client: [], // Sin acceso al sistema admin

  agent: [
    "/",
    "/products",
    "/products/:id",
    "/users",
    "/orders",
    "/orders/:id",
    "/orders/:id/add-products",
    "/profile",
    "/settings",
  ],

  accountant: [
    "/",
    "/invoices",
    "/expenses",
    "/balance",
    "/balance/new-balance",
    "/client-balances",
    "/analytics",
    "/profile",
    "/settings",
  ],

  logistical: [
    "/",
    "/products",
    "/products/:id",
    "/packages",
    "/packages/new",
    "/packages/:id",
    "/packages/:id/edit",
    "/packages/:id/manage-products",
    "/packages/:id/add-products",
    "/packages/:id/remove-products",
    "/delivery",
    "/delivery/new",
    "/delivery/:id",
    "/delivery/:id/edit",
    "/delivery/:id/manage-products",
    "/delivery/:id/add-products",
    "/delivery/:id/remove-products",
    "/profile",
    "/settings",
  ],
};

/**
 * Verifica si un rol tiene permiso para acceder a un pathname.
 * Soporta rutas dinámicas con segmentos tipo :id.
 */
export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  if (role === "admin") return true;
  if (role === "client") return false;

  const allowedRoutes = roleAllowedRoutes[role];

  return allowedRoutes.some((route) => {
    // Convertir patrón de ruta a regex: /orders/:id => /orders/[^/]+
    const pattern = route.replace(/:[\w]+/g, "[^/]+");
    const regex = new RegExp(`^${pattern}(/.*)?$`);
    return regex.test(pathname);
  });
}

/**
 * Rutas base del sidebar visibles para cada rol (para filtrar los grupos de navegación).
 */
export const roleVisibleNavHrefs: Record<Exclude<UserRole, "admin">, string[]> = {
  client: [],

  agent: ["/", "/users", "/orders", "/products", "/products/:id", "/delivery"],

  accountant: ["/", "/invoices", "/expenses", "/balance", "/client-balances", "/analytics"],

  logistical: ["/", "/packages", "/delivery", "/products", "/products/:id"],
};