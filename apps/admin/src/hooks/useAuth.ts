/**
 * useAuth Hook - Hook personalizado para manejar la autenticación
 * 
 * Proporciona una interfaz simple para interactuar con el contexto de autenticación
 * y utilidades adicionales para manejo de permisos y roles.
 */

import { useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { CustomUser, UserRole } from '../types/database';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '../types/api';

// Tipos para el hook
export interface UseAuthReturn {
  // Estado
  user: CustomUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  lastActivity: Date | null;

  // Acciones
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (userData: Partial<CustomUser>) => Promise<void>;
  clearError: () => void;

  // Utilidades de permisos y roles
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAgent: boolean;
  isAccountant: boolean;
  isBuyer: boolean;
  isLogistical: boolean;
  isCommunityManager: boolean;
  isStaff: boolean;
  isActive: boolean;
  isVerified: boolean;

  // Utilidades adicionales
  canManageOrders: boolean;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canViewAnalytics: boolean;
  canManageDeliveries: boolean;
}

/**
 * Hook principal para manejar autenticación
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Verificar permisos basados en roles del usuario
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!context.user) return false;

    switch (role) {
      case 'agent':
        return context.user.is_agent;
      case 'accountant':
        return context.user.is_accountant;
      case 'buyer':
        return context.user.is_buyer;
      case 'logistical':
        return context.user.is_logistical;
      case 'community_manager':
        return context.user.is_comunity_manager;
      default:
        return false;
    }
  }, [context.user]);

  // Verificar si tiene alguno de los roles especificados
  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  // Propiedades de rol computed
  const isAgent = context.user?.is_agent ?? false;
  const isAccountant = context.user?.is_accountant ?? false;
  const isBuyer = context.user?.is_buyer ?? false;
  const isLogistical = context.user?.is_logistical ?? false;
  const isCommunityManager = context.user?.is_comunity_manager ?? false;
  const isStaff = context.user?.is_staff ?? false;
  const isActive = context.user?.is_active ?? false;
  const isVerified = context.user?.is_verified ?? false;

  // Permisos específicos basados en roles
  const canManageOrders = isAgent || isStaff;
  const canManageUsers = isStaff;
  const canManageProducts = isBuyer || isAgent || isStaff;
  const canViewAnalytics = isAccountant || isStaff;
  const canManageDeliveries = isLogistical || isStaff;

  return {
    // Estado del contexto
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    permissions: context.permissions,
    lastActivity: context.lastActivity,

    // Acciones del contexto
    login: context.login,
    register: context.register,
    logout: context.logout,
    refreshAuth: context.refreshAuth,
    updateUser: context.updateUser,
    clearError: context.clearError,

    // Utilidades de permisos
    hasPermission: context.hasPermission,
    hasRole,
    hasAnyRole,

    // Propiedades de rol
    isAgent,
    isAccountant,
    isBuyer,
    isLogistical,
    isCommunityManager,
    isStaff,
    isActive,
    isVerified,

    // Permisos específicos
    canManageOrders,
    canManageUsers,
    canManageProducts,
    canViewAnalytics,
    canManageDeliveries,
  };
}

/**
 * Hook para verificar permisos específicos
 */
export function usePermissions() {
  const { hasPermission, hasRole, hasAnyRole, user } = useAuth();

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    
    // Verificaciones de permisos comunes
    canCreateOrder: () => hasAnyRole(['agent']) || user?.is_staff,
    canEditOrder: () => hasAnyRole(['agent']) || user?.is_staff,
    canDeleteOrder: () => user?.is_staff,
    canViewOrder: () => hasAnyRole(['agent', 'accountant', 'logistical']) || user?.is_staff,
    
    canCreateProduct: () => hasAnyRole(['buyer', 'agent']) || user?.is_staff,
    canEditProduct: () => hasAnyRole(['buyer', 'agent']) || user?.is_staff,
    canDeleteProduct: () => hasAnyRole(['buyer']) || user?.is_staff,
    canViewProduct: () => hasAnyRole(['buyer', 'agent', 'logistical']) || user?.is_staff,
    
    canManageUsers: () => user?.is_staff,
    canViewUserList: () => user?.is_staff,
    canEditUser: (targetUserId?: number) => {
      if (user?.is_staff) return true;
      if (targetUserId && user?.id === targetUserId) return true;
      return false;
    },
    
    canViewAnalytics: () => hasAnyRole(['accountant']) || user?.is_staff,
    canExportData: () => hasAnyRole(['accountant']) || user?.is_staff,
    
    canManageDeliveries: () => hasAnyRole(['logistical']) || user?.is_staff,
    canViewDeliveries: () => hasAnyRole(['logistical', 'agent']) || user?.is_staff,
    
    canManageShops: () => hasAnyRole(['buyer']) || user?.is_staff,
    canViewShops: () => hasAnyRole(['buyer', 'agent']) || user?.is_staff,
  };
}

/**
 * Hook para manejar el estado de loading durante operaciones de auth
 */
export function useAuthLoading() {
  const { isLoading } = useAuth();
  
  return {
    isLoading,
    isAuthenticating: isLoading,
  };
}

/**
 * Hook para manejar errores de autenticación
 */
export function useAuthError() {
  const { error, clearError } = useAuth();
  
  return {
    error,
    hasError: !!error,
    clearError,
  };
}

/**
 * Hook para información del usuario actual
 */
export function useCurrentUser() {
  const { user, updateUser, isAuthenticated } = useAuth();
  
  const fullName = user ? `${user.name} ${user.last_name}` : '';
  const initials = user ? `${user.name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() : '';
  
  return {
    user,
    fullName,
    initials,
    isAuthenticated,
    updateUser,
    
    // Información adicional
    email: user?.email || '',
    name: user?.name || '',
    lastName: user?.last_name || '',
    phone: user?.phone_number || '',
    address: user?.home_address || '',
    agentProfit: user?.agent_profit || 0,
    dateJoined: user?.date_joined || '',
  };
}

export default useAuth;
