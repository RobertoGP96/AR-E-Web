/**
 * Tipos para el modelo CustomUser
 */

import type { ID, DateTime } from './base';

// Roles disponibles para usuarios
export type UserRole = 
  | 'user'
  | 'agent'
  | 'accountant'
  | 'buyer'
  | 'logistical'
  | 'community_manager'
  | 'admin'
  | 'client';

// Modelo principal
export interface CustomUser {
  // Account data
  id: ID;
  email: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;

  // Roles
  role: UserRole;
  agent_profit: number;

  // Account management
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  date_joined: DateTime;
  sent_verification_email: boolean;
  verification_secret?: string;
  password_secret?: string;

  // Django related fields (for compatibility)
  groups?: number[]; // IDs de grupos
  user_permissions?: number[]; // IDs de permisos

  // Propiedades computadas
  full_name: string;

  // Extras para UI (no existen en el modelo pero útiles para la tabla)
  ordersCount?: number;
  lastAccess?: DateTime;
}

// Tipos para crear/editar usuario
export interface CreateUserData {
  email: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
  password: string;
  role?: UserRole;
  agent_profit?: number;
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: ID;
}

// Filtros para usuarios
export interface UserFilters {
  is_active?: boolean;
  is_verified?: boolean;
  role?: UserRole;
  search?: string;
}

// Permisos de usuario
export interface UserPermissions {
  can_create_orders: boolean;
  can_edit_orders: boolean;
  can_delete_orders: boolean;
  can_manage_users: boolean;
  can_manage_products: boolean;
  can_manage_shops: boolean;
  can_view_analytics: boolean;
  can_manage_deliveries: boolean;
}

// Funciones de utilidad para verificar roles
export const userRoleUtils = {
  hasRole: (user: CustomUser, role: UserRole): boolean => {
    return user.role === role;
  },
  
  isAgent: (user: CustomUser): boolean => {
    return user.role === 'agent';
  },
  
  isAccountant: (user: CustomUser): boolean => {
    return user.role === 'accountant';
  },
  
  isBuyer: (user: CustomUser): boolean => {
    return user.role === 'buyer';
  },
  
  isLogistical: (user: CustomUser): boolean => {
    return user.role === 'logistical';
  },
  
  isCommunityManager: (user: CustomUser): boolean => {
    return user.role === 'community_manager';
  },
  
  isAdmin: (user: CustomUser): boolean => {
    return user.role === 'admin' || user.is_staff;
  },
  
  isUser: (user: CustomUser): boolean => {
    return user.role === 'user';
  }
};

// Etiquetas para mostrar en la UI
export const roleLabels: Record<UserRole, string> = {
  user: 'Usuario',
  agent: 'Agente',
  accountant: 'Contador',
  buyer: 'Comprador',
  logistical: 'Logístico',
  community_manager: 'Community Manager',
  admin: 'Administrador',
  client: 'Cliente',
};
