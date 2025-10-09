/**
 * Tipos base y estados para todos los modelos
 */

// Tipos base para campos comunes
export type ID = number;
export type UUID = string;
export type DateTime = string; // ISO string format
export type Date = string; // ISO date format

// Union types para estados (Alineados con el backend en español)
export type OrderStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado";
export type PayStatus = "No pagado" | "Pagado" | "Parcial";
export type ProductStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado"; // Usa los mismos estados que Order
export type ShoppingStatus = "No pagado" | "Pagado" | "Parcial"; // Usa los mismos estados que Payment
export type DeliveryStatus = "Pendiente" | "En transito" | "Entregado" | "Fallida";
export type PackageStatus = "Encargado" | "Procesando" | "Completado" | "Cancelado"; // Usa los mismos estados que Order

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
  PROCESANDO: "Procesando",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado"
} as const;

export const SHOPPING_STATUSES = {
  NO_PAGADO: "No pagado",
  PAGADO: "Pagado",
  PARCIAL: "Parcial"
} as const;

export const DELIVERY_STATUSES = {
  PENDIENTE: "Pendiente",
  EN_TRANSITO: "En transito",
  ENTREGADO: "Entregado",
  FALLIDA: "Fallida"
} as const;

export const PACKAGE_STATUSES = {
  ENCARGADO: "Encargado",
  PROCESANDO: "Procesando",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado"
} as const;

// Tipos de roles de usuario (incluye 'user' y 'admin' que faltaban)
export type UserRole = 'user' | 'agent' | 'accountant' | 'buyer' | 'logistical' | 'community_manager' | 'admin' | 'client';
