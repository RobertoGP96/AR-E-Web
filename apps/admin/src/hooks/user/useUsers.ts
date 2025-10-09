/**
 * Hook personalizado para gestionar usuarios con TanStack Query
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  getUsers, 
  getUserById, 
  getCurrentUserProfile,
  searchUsers,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  updateUserVerificationStatus,
  updateUserActiveStatus
} from '@/services/users';
import type { UserFilters } from '@/types/api';
import type { CreateUserData, UpdateUserData } from '@/types/models/user';

/**
 * Query key factory para usuarios
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

/**
 * Hook para obtener lista de usuarios con paginación y filtros
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un usuario por ID
 */
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

/**
 * Hook para obtener el perfil del usuario actual
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: getCurrentUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar usuarios
 */
export function useSearchUsers(searchTerm: string, filters?: UserFilters) {
  return useQuery({
    queryKey: [...userKeys.lists(), 'search', searchTerm, filters],
    queryFn: () => searchUsers(searchTerm, filters),
    enabled: searchTerm.length > 0,
  });
}

/**
 * Hook para obtener usuarios por rol
 */
export function useUsersByRole(role: string, filters?: UserFilters) {
  return useQuery({
    queryKey: [...userKeys.lists(), 'role', role, filters],
    queryFn: () => getUsersByRole(role, filters),
    enabled: !!role,
  });
}

/**
 * Hook para invalidar cache de usuarios
 */
export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
    invalidateUser: (id: number) => queryClient.invalidateQueries({ queryKey: userKeys.detail(id) }),
  };
}

/**
 * Hook para crear un nuevo usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserData) => createUser(userData),
    onSuccess: () => {
      // Invalidar el cache de la lista de usuarios
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UpdateUserData) => updateUser(userData.id, userData),
    onSuccess: (data) => {
      // Invalidar el cache del usuario específico y las listas
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar un usuario
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      // Invalidar el cache de las listas de usuarios
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook para verificar un usuario manualmente
 */
export function useVerifyUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, verified }: { userId: number; verified: boolean }) => 
      updateUserVerificationStatus(userId, verified),
    onSuccess: (data) => {
      // Invalidar el cache del usuario específico y las listas
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook para activar/desactivar un usuario
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => 
      updateUserActiveStatus(userId, isActive),
    onSuccess: (data) => {
      // Invalidar el cache del usuario específico y las listas
      queryClient.invalidateQueries({ queryKey: userKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
