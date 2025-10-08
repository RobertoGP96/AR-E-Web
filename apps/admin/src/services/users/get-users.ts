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
  return await apiClient.getPaginated<CustomUser>('/api_data/user/', filters);
};

/**
 * Obtiene un usuario por ID
 */
export const getUserById = async (id: number) => {
  return await apiClient.get<CustomUser>(`/api_data/user/${id}/`);
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUserProfile = async () => {
  return await apiClient.get<CustomUser>('/user/');
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
