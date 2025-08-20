/**
 * Custom hooks para el manejo de autenticación
 * 
 * Proporciona hooks personalizados que utilizan el AuthContext
 * para facilitar el acceso a funcionalidades específicas de autenticación.
 */

import { useContext, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import type { CustomUser } from '@/types/models';
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from '@/types/api';

// Tipo de retorno para el hook principal useAuth
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
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  clearError: () => void;
}

/**
 * Hook principal para acceder al contexto de autenticación
 */
export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

/**
 * Hook para obtener solo la información del usuario
 */
export const useAuthUser = () => {
  const { user } = useAuth();
  return user;
};

/**
 * Hook para obtener solo el estado de autenticación
 */
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
};

/**
 * Hook para obtener solo el estado de carga
 */
export const useAuthLoading = () => {
  const { isLoading } = useAuth();
  return isLoading;
};

/**
 * Hook para obtener solo errores de autenticación
 */
export const useAuthError = () => {
  const { error, clearError } = useAuth();
  return { error, clearError };
};

/**
 * Hook para verificar permisos específicos
 */
export const usePermissions = (requiredPermissions?: string | string[]) => {
  const { permissions, hasPermission } = useAuth();
  
  return useMemo(() => {
    if (!requiredPermissions) {
      return { permissions, hasPermission };
    }
    
    const permsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    const hasAllPermissions = permsArray.every(perm => hasPermission(perm));
    const hasSomePermissions = permsArray.some(perm => hasPermission(perm));
    
    return {
      permissions,
      hasPermission,
      hasAllPermissions,
      hasSomePermissions,
      requiredPermissions: permsArray,
    };
  }, [permissions, hasPermission, requiredPermissions]);
};

/**
 * Hook para verificar roles específicos
 */
export const useRoles = (requiredRoles?: string | string[]) => {
  const { user, hasRole } = useAuth();
  
  return useMemo(() => {
    if (!requiredRoles) {
      return { user, hasRole };
    }
    
    const rolesArray = Array.isArray(requiredRoles) 
      ? requiredRoles 
      : [requiredRoles];
    
    const hasAllRoles = rolesArray.every(role => hasRole(role));
    const hasSomeRoles = rolesArray.some(role => hasRole(role));
    
    return {
      user,
      hasRole,
      hasAllRoles,
      hasSomeRoles,
      requiredRoles: rolesArray,
    };
  }, [user, hasRole, requiredRoles]);
};

/**
 * Hook para verificar si el usuario es administrador
 */
export const useIsAdmin = () => {
  const { user } = useAuth();
  return useMemo(() => {
    return user?.is_staff || false;
  }, [user]);
};

/**
 * Hook para obtener acciones de autenticación
 */
export const useAuthActions = () => {
  const { login, register, logout, refreshAuth, updateUser, clearError } = useAuth();
  
  return {
    login,
    register, 
    logout,
    refreshAuth,
    updateUser,
    clearError,
  };
};

// Exportación por defecto del hook principal
export default useAuth;
