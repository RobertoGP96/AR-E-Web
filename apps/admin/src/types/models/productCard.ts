import type { Product } from '@/types/database';

/**
 * Interfaz extendida para mostrar datos adicionales en el grid de products
 * Extiende el modelo base Product con campos adicionales para la UI
 */
export interface ProductCardData extends Omit<Product, 'order'> {
  /** Order asociada (opcional para evitar conflictos de tipos) */
  order?: { id: number; total_cost: number };
  /** Stock disponible para mostrar en la UI */
  stock?: number;
  /** Ventas del mes para mostrar estadísticas */
  monthlySales?: number;
  /** Color del gradiente para la tarjeta */
  gradientFrom?: string;
  /** Color del gradiente para la tarjeta */
  gradientTo?: string;
}

/**
 * Configuración de estados para mostrar en las tarjetas
 */
export const productStatusConfig = {
  'Encargado': {
    label: "Encargado",
    className: "bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100"
  },
  'Comprado': {
    label: "Comprado", 
    className: "bg-blue-100/90 text-blue-800 hover:bg-blue-100"
  },
  'Recibido': {
    label: "Recibido",
    className: "bg-purple-100/90 text-purple-800 hover:bg-purple-100"
  },
  'Entregado': {
    label: "Entregado",
    className: "bg-green-100/90 text-green-800 hover:bg-green-100"
  }
} as const;

/**
 * Configuración de colores para categorías
 */
export const categoryColors = {
  'electronics': {
    label: "Electrónicos",
    className: "text-blue-600 border-blue-200 bg-blue-50/50",
    gradient: "from-orange-400 to-amber-500"
  },
  'clothing': {
    label: "Ropa", 
    className: "text-purple-600 border-purple-200 bg-purple-50/50",
    gradient: "from-blue-400 to-purple-500"
  },
  'food': {
    label: "Alimentos",
    className: "text-green-600 border-green-200 bg-green-50/50", 
    gradient: "from-green-400 to-teal-500"
  },
  'books': {
    label: "Libros",
    className: "text-indigo-600 border-indigo-200 bg-indigo-50/50",
    gradient: "from-pink-400 to-rose-500"
  }
} as const;
