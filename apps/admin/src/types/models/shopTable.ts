import type { Shop } from '@/types/models/shop';

/**
 * Interfaz extendida para mostrar datos adicionales en la tabla de shops
 * Extiende el modelo base Shop con campos adicionales para la UI
 */
export interface ShopTableData extends Shop {
  /** Dirección física de la tienda */
  address?: string;
  /** Ciudad donde se encuentra la tienda */
  city?: string;
  /** Estado operacional de la tienda */
  status?: 'active' | 'maintenance' | 'inactive';
  /** Número de empleados en la tienda */
  employees?: number;
  /** Ventas mensuales en moneda local */
  monthlySales?: number;
}

/**
 * Configuración de estados para mostrar en la tabla
 */
export const shopStatusConfig = {
  active: {
    label: "Activa",
    className: "bg-green-100 text-green-800"
  },
  maintenance: {
    label: "Mantenimiento", 
    className: "bg-yellow-100 text-yellow-800"
  },
  inactive: {
    label: "Inactiva",
    className: "bg-red-100 text-red-800"
  }
} as const;

/**
 * Tipo para los estados válidos de una tienda
 */
export type ShopStatus = keyof typeof shopStatusConfig;
