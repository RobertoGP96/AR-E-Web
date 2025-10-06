import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  // Mutation para actualizar el perfil usando el servicio de usuarios
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UpdateUserData>) => {
      // Usar el servicio específico de usuarios que maneja el endpoint correcto
      const updatedUser = await updateCurrentUserProfile(data);
      // También actualizar en el contexto de auth
      await authUpdateUser(data);
      return updatedUser;
    },
    onSuccess: () => {
      // Invalidar y refrescar los datos del usuario
      queryClient.invalidateQueries({ queryKey: ['user'] });
      refreshAuth();
      toast.success('Perfil actualizado correctamente');
    },
    onError: () => {
      // Error actualizando perfil
      toast.error('Error al actualizar el perfil. Intenta nuevamente.');
    }
  });

  // Función para actualizar el usuario
  const updateUser = useCallback(async (data: Partial<UpdateUserData>) => {
    await updateMutation.mutateAsync(data);
  }, [updateMutation]);

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