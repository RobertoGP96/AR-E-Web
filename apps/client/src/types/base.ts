/**
 * Tipos base y estados para todos los modelos
 */

// Tipos base para campos comunes
export type ID = number;
export type UUID = string;
export type DateTime = string; // ISO string format
export type Date = string; // ISO date format

// Union types para estados
export type OrderStatus = "Encargado" | "En proceso" | "Completado" | "Cancelado";
export type PayStatus = "Pendiente" | "Pagado" | "Parcial";
export type ProductStatus = "Encargado" | "Comprado" | "Recivido" | "Entregado";
export type ShoppingStatus = "Pendiente" | "Pagado" | "En proceso";
export type DeliveryStatus = "Enviado" | "In Transit" | "Entregado";
export type PackageStatus = "Enviado" | "Procesado" | "Recivido";

// Constantes para los valores
export const ORDER_STATUSES = {
  ORDERED: "Encargado",
  PROCESSING: "Enproceso", 
  COMPLETED: "Completado",
  CANCELLED: "Cancelado"
} as const;

export const PAY_STATUSES = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  PARTIAL: "Partial"
} as const;

export const PRODUCT_STATUSES = {
  ORDERED: "Ordered",
  PURCHASED: "Purchased",
  RECEIVED: "Received",
  DELIVERED: "Delivered"
} as const;


export const DELIVERY_STATUSES = {
  SENT: "Sent",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered"
} as const;


// Tipos de roles de usuario
export type UserRole = 'agent' | 'accountant' | 'buyer' | 'logistical' | 'community_manager' | 'client';
