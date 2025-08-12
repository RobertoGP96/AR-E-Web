import type { Order } from '@/types/models/order';

/**
 * Interfaz extendida para mostrar datos adicionales en la tabla de orders
 * Extiende el modelo base Order con campos adicionales para la UI
 */
export interface OrderTableData extends Order {
  /** Nombre del cliente para mostrar en la tabla */
  customerName?: string;
  /** Email del cliente */
  customerEmail?: string;
  /** Fecha de la orden en formato string */
  orderDate?: string;
  /** Número de items en la orden */
  itemsCount?: number;
}

/**
 * Configuración de estados para mostrar en la tabla
 */
export const orderStatusConfig = {
  'Completado': {
    label: "Completada",
    className: "bg-green-100 text-green-800"
  },
  'Encargado': {
    label: "Pendiente", 
    className: "bg-yellow-100 text-yellow-800"
  },
  'Procesando': {
    label: "Procesando",
    className: "bg-blue-100 text-blue-800"
  },
  'Cancelado': {
    label: "Cancelada",
    className: "bg-red-100 text-red-800"
  }
} as const;

/**
 * Configuración de estados de pago para mostrar en la tabla
 */
export const payStatusConfig = {
  'Pagado': {
    label: "Pagado",
    className: "bg-green-100 text-green-800"
  },
  'No pagado': {
    label: "No pagado",
    className: "bg-red-100 text-red-800"
  },
  'Parcial': {
    label: "Parcial",
    className: "bg-yellow-100 text-yellow-800"
  }
} as const;
