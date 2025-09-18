/**
 * Tipos base y estados para todos los modelos
 */

// Tipos base para campos comunes
export type ID = number;
export type UUID = string;
export type DateTime = string; // ISO string format
export type Date = string; // ISO date format

// Union types para estados
export type OrderStatus = "Ordered" | "Processing" | "Completed" | "Cancelled";
export type PayStatus = "Unpaid" | "Paid" | "Partial";
export type ProductStatus = "Ordered" | "Purchased" | "Received" | "Delivered";
export type ShoppingStatus = "Unpaid" | "Paid" | "Processing";
export type DeliveryStatus = "Sent" | "In Transit" | "Delivered";
export type PackageStatus = "Sent" | "Processed" | "Received";

// Constantes para los valores
export const ORDER_STATUSES = {
  ORDERED: "Ordered",
  PROCESSING: "Processing", 
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
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

export const SHOPPING_STATUSES = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  PROCESSING: "Processing"
} as const;

export const DELIVERY_STATUSES = {
  SENT: "Sent",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered"
} as const;

export const PACKAGE_STATUSES = {
  SENT: "Sent",
  PROCESSED: "Processed",
  RECEIVED: "Received"
} as const;

// Tipos de roles de usuario
export type UserRole = 'agent' | 'accountant' | 'buyer' | 'logistical' | 'community_manager' | 'client';
