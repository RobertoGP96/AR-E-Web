/**
 * Tipos base y estados para todos los modelos
 */

// Tipos base para campos comunes
export type ID = number;
export type UUID = string;
export type DateTime = string; // ISO string format
export type Date = string; // ISO date format

// Union types para estados
export type OrderStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado";
export type PayStatus = "No pagado" | "Pagado" | "Parcial";
export type ProductStatus = "Encargado" | "Comprado" | "Recibido" | "Entregado";
export type ShoppingStatus = "No pagado" | "Pagado" | "Procesando";
export type DeliveryStatus = "Enviado" | "En tránsito" | "Entregado";
export type PackageStatus = "Enviado" | "En tránsito" | "Recibido";

// Constantes para los valores
export const ORDER_STATUSES = {
  ENCARGADO: "Encargado",
  PROCESANDO: "Procesando", 
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado"
} as const;

export const PAY_STATUSES = {
  NO_PAGADO: "No pagado",
  PAGADO: "Pagado",
  PARCIAL: "Parcial"
} as const;

export const PRODUCT_STATUSES = {
  ENCARGADO: "Encargado",
  COMPRADO: "Comprado",
  RECIBIDO: "Recibido",
  ENTREGADO: "Entregado"
} as const;

export const SHOPPING_STATUSES = {
  NO_PAGADO: "No pagado",
  PAGADO: "Pagado",
  PROCESANDO: "Procesando"
} as const;

export const DELIVERY_STATUSES = {
  ENVIADO: "Enviado",
  EN_TRANSITO: "En tránsito",
  ENTREGADO: "Entregado"
} as const;

export const PACKAGE_STATUSES = {
  ENVIADO: "Enviado",
  EN_TRANSITO: "En tránsito",
  RECIBIDO: "Recibido"
} as const;

// Tipos de roles de usuario
export type UserRole = 'agent' | 'accountant' | 'buyer' | 'logistical' | 'community_manager';
