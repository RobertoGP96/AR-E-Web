/**
 * Servicio para obtener usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { 
  CustomUser, 
  PaginatedApiResponse 
} from '../../types';
import type { UserFilters } from '../../types/api';

/**
 * Obtiene lista paginada de usuarios
 */
export const getUsers = async (
  filters?: UserFilters
): Promise<PaginatedApiResponse<CustomUser>> => {
  // Debug: Ver qué filtros se reciben
  
  const response = await apiClient.getPaginated<CustomUser>('/api_data/user/', filters);
  
 
  
  // Verificar y mapear user_id a id si es necesario (compatibilidad con backend)
  if (response.results && response.results.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primerUsuario = response.results[0] as any;
    if (primerUsuario.user_id && !primerUsuario.id) {
      // Mapear user_id a id para compatibilidad
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.results = response.results.map((user: any) => ({
        ...user,
        id: user.user_id || user.id
      }));
    }
  }
  
  return response;
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = async (id: number) => {
  const user = await apiClient.get<CustomUser>(`/api_data/user/${id}/`);
  
  // Mapear user_id a id si es necesario (compatibilidad con backend)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAny = user as any;
  if (userAny.user_id && !userAny.id) {
    return { ...user, id: userAny.user_id };
  }
  
  return user;
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUserProfile = async () => {
  const user = await apiClient.get<CustomUser>('/user/');
  
  // Mapear user_id a id si es necesario (compatibilidad con backend)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAny = user as any;
  if (userAny.user_id && !userAny.id) {
    return { ...user, id: userAny.user_id };
  }
  
  return user;
};

/**
 * Obtiene usuarios por rol
 */
export const getUsersByRole = async (role: string, filters?: UserFilters) => {
  const roleFilters = { ...filters, role };
  return await apiClient.getPaginated<CustomUser>('/api_data/user/', roleFilters);
};

/**
 * Búsqueda de usuarios por término
 */
export const searchUsers = async (searchTerm: string, filters?: UserFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<CustomUser>('/api_data/user/', searchFilters);
};

/**
 * Obtiene agentes disponibles
 */
export const getAgents = async () => {
  return await getUsersByRole('agent');
};

/**
 * Obtiene contadores disponibles
 */
export const getAccountants = async () => {
  return await getUsersByRole('accountant');
};

/**
 * Obtiene compradores disponibles
 */
export const getBuyers = async () => {
  return await getUsersByRole('buyer');
};

/**
 * Obtiene logísticos disponibles
 */
export const getLogisticals = async () => {
  return await getUsersByRole('logistical');
};
