/**
 * Hook personalizado para gestionar usuarios con TanStack Query
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getUsers, 
  getUserById, 
  getCurrentUserProfile,
  searchUsers,
  getUsersByRole
} from '@/services/users';
import type { UserFilters } from '@/types/api';

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
