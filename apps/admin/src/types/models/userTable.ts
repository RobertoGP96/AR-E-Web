import type { CustomUser } from '@/types/database';

/**
 * Interfaz extendida para mostrar datos adicionales en la tabla de usuarios
 * Extiende el modelo base CustomUser con campos adicionales para la UI
 */
export interface UserTableData extends CustomUser {
  /** Rol principal del usuario para mostrar en la tabla */
  primaryRole?: string;
  /** Avatar del usuario (iniciales o URL) */
  avatar?: string;
  /** Último acceso del usuario */
  lastAccess?: string;
  /** Número de órdenes del usuario */
  ordersCount?: number;
}

/**
 * Configuración de roles para mostrar en la tabla
 */
export const userRoleConfig = {
  'admin': {
    label: "Administrador",
    className: "bg-red-100/90 text-red-800 hover:bg-red-100",
    icon: "shield"
  },
  'agent': {
    label: "Agente",
    className: "bg-green-100/90 text-green-800 hover:bg-green-100", 
    icon: "user"
  },
  'buyer': {
    label: "Comprador",
    className: "bg-blue-100/90 text-blue-800 hover:bg-blue-100",
    icon: "shopping-cart"
  },
  'logistical': {
    label: "Logística", 
    className: "bg-purple-100/90 text-purple-800 hover:bg-purple-100",
    icon: "truck"
  },
  'accountant': {
    label: "Contador",
    className: "bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100",
    icon: "calculator"
  },
  'comunity_manager': {
    label: "Community Manager",
    className: "bg-pink-100/90 text-pink-800 hover:bg-pink-100",
    icon: "megaphone"
  },
  'client': {
    label: "Cliente",
    className: "bg-gray-100/90 text-gray-800 hover:bg-gray-100",
    icon: "user"
  }
} as const;

/**
 * Configuración de estados para mostrar en la tabla
 */
export const userStatusConfig = {
  'active': {
    label: "Activo",
    className: "bg-green-100/90 text-green-800 hover:bg-green-100"
  },
  'inactive': {
    label: "Inactivo", 
    className: "bg-red-100/90 text-red-800 hover:bg-red-100"
  },
  'verified': {
    label: "Verificado",
    className: "bg-blue-100/90 text-blue-800 hover:bg-blue-100"
  },
  'pending': {
    label: "Pendiente",
    className: "bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100"
  }
} as const;
