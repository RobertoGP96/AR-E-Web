import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateCurrentUserProfile } from '@/services/auth/user';
import { useAuth } from '@/hooks/auth/useAuth';
import type { CustomUser, UpdateUserData, UserRole } from '@/types/user.d';

// Etiquetas para mostrar en la UI
const roleLabels: Record<UserRole, string> = {
  user: 'Usuario',
  agent: 'Agente',
  accountant: 'Contador',
  buyer: 'Comprador',
  logistical: 'Logístico',
  community_manager: 'Community Manager',
  admin: 'Administrador',
  client: 'Cliente',
};

export interface UseUserReturn {
  // Estado del usuario
  user: CustomUser | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  
  // Funciones para actualizar
  updateUser: (data: Partial<UpdateUserData>) => Promise<void>;
  isUpdating: boolean;
  updateError: string | null;
  
  // Funciones de utilidad
  refreshUser: () => Promise<void>;
  getUserDisplayName: () => string;
  getUserRole: () => string;
  isAuthenticated: boolean;
}

/**
 * Hook personalizado para gestionar la información del usuario actual
 * Utiliza el contexto de autenticación como fuente principal de datos
 */
export const useUser = (): UseUserReturn => {
  const queryClient = useQueryClient();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    refreshAuth,
    updateUser: authUpdateUser
  } = useAuth();

  // Mutation para actualizar el perfil combinando servicio y contexto
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UpdateUserData>) => {
      // 1. Primero actualizar en el backend usando el servicio específico
      const updatedUser = await updateCurrentUserProfile(data);
      
      // 2. Luego sincronizar con el contexto de auth usando los datos completos del backend
      await authUpdateUser(updatedUser);
      
      return updatedUser;
    },
    onSuccess: () => {
      // Invalidar queries para refetch si es necesario
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: unknown) => {
      console.error('Error updating user profile:', error);
    }
  }); 

  // Función para actualizar el usuario
  const updateUser = useCallback(async (data: Partial<UpdateUserData>) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

  // Función para extraer mensaje de error detallado
  const getErrorMessage = useCallback((error: unknown): string => {
    if (typeof error === 'string') return error;
    
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      
      // Error de API con detalles específicos
      if (err.details && typeof err.details === 'object') {
        const details = err.details as Record<string, unknown>;
        
        // Errores de validación por campo
        const fieldErrors: string[] = [];
        
        if (details.email) {
          const emailErrors = Array.isArray(details.email) ? details.email : [details.email];
          fieldErrors.push(`Email: ${emailErrors[0]}`);
        }
        
        if (details.phone_number) {
          const phoneErrors = Array.isArray(details.phone_number) ? details.phone_number : [details.phone_number];
          fieldErrors.push(`Teléfono: ${phoneErrors[0]}`);
        }
        
        if (details.name) {
          const nameErrors = Array.isArray(details.name) ? details.name : [details.name];
          fieldErrors.push(`Nombre: ${nameErrors[0]}`);
        }
        
        if (details.last_name) {
          const lastNameErrors = Array.isArray(details.last_name) ? details.last_name : [details.last_name];
          fieldErrors.push(`Apellido: ${lastNameErrors[0]}`);
        }
        
        if (details.home_address) {
          const addressErrors = Array.isArray(details.home_address) ? details.home_address : [details.home_address];
          fieldErrors.push(`Dirección: ${addressErrors[0]}`);
        }
        
        if (details.non_field_errors) {
          const nonFieldErrors = Array.isArray(details.non_field_errors) ? details.non_field_errors : [details.non_field_errors];
          fieldErrors.push(nonFieldErrors[0]);
        }
        
        if (fieldErrors.length > 0) {
          return fieldErrors.join(' • ');
        }
      }
      
      // Mensaje de error directo
      if (err.message) return String(err.message);
      if (err.error) return String(err.error);
      
      // Error de red
      if (err.isNetworkError) return 'Error de conexión. Verifica tu conexión a internet.';
      if (err.isServerError) return 'Error del servidor. Intenta nuevamente en unos minutos.';
      if (err.status === 401) return 'Sesión expirada. Inicia sesión nuevamente.';
      if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
      if (err.status === 429) return 'Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.';
    }
    
    return 'Error al actualizar el perfil. Intenta nuevamente.';
  }, []);

  // Función para refrescar los datos del usuario
  const refreshUser = useCallback(async () => {
    await refreshAuth();
  }, [refreshAuth]);

  // Función para obtener el nombre completo del usuario
  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Usuario';
    return user.full_name || `${user.name} ${user.last_name}`.trim() || user.email || 'Usuario';
  }, [user]);

  // Función para obtener el rol del usuario en español
  const getUserRole = useCallback((): string => {
    if (!user?.role) return 'Usuario';
    return roleLabels[user.role as UserRole] || user.role;
  }, [user]);

  return {
    // Estado del usuario (del contexto de auth)
    user,
    isLoading,
    isError: Boolean(error),
    error,
    
    // Funciones para actualizar
    updateUser,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error ? getErrorMessage(updateMutation.error) : null,
    
    // Funciones de utilidad
    refreshUser,
    getUserDisplayName,
    getUserRole,
    isAuthenticated
  };
};

// Hook adicional para obtener solo los datos básicos del usuario
export const useUserBasic = () => {
  const { user, isLoading, getUserDisplayName, getUserRole, isAuthenticated } = useUser();
  
  return {
    user,
    isLoading,
    displayName: getUserDisplayName(),
    role: getUserRole(),
    isAuthenticated
  };
};

// Hook para verificar permisos del usuario
export const useUserPermissions = () => {
  const { user } = useUser();
  
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);
  
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.is_staff || false;
  }, [user]);
  
  const isAgent = useCallback(() => {
    return user?.role === 'agent';
  }, [user]);
  
  const canManageUsers = useCallback(() => {
    return isAdmin() || hasRole('community_manager');
  }, [isAdmin, hasRole]);
  
  const canManageOrders = useCallback(() => {
    return isAdmin() || isAgent() || hasRole('logistical');
  }, [isAdmin, isAgent, hasRole]);
  
  return {
    hasRole,
    isAdmin,
    isAgent,
    canManageUsers,
    canManageOrders,
    user
  };
};