/**
 * Servicio de información de usuario
 * Servicios para gestionar usuarios del sistema
 */

import type { 
  PaginatedApiResponse, 
  UserFilters,
  BaseFilters,
  ApiResponse
} from '@/types/api';
import type { 
  CustomUser, 
  CreateUserData, 
  UpdateUserData,
  UserRole
} from '@/types/user';

import { apiClient } from '@/lib';

// ==================== CRUD BÁSICO DE USUARIOS ====================

/**
 * Obtener información de un usuario específico por ID
 */
export const getUserInfo = async (id: number): Promise<CustomUser> => {
  const response = await apiClient.get<CustomUser>(`/api_data/user/${id}/`);
  return response || ({} as CustomUser);
};

/**
 * Listar todos los usuarios con filtros opcionales
 */
export const getUsers = async (filters?: UserFilters & BaseFilters): Promise<PaginatedApiResponse<CustomUser>> => {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  
  const queryString = params.toString();
  const url = `/api_data/user/${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.getPaginated<CustomUser>(url);
};

/**
 * Crear un nuevo usuario
 */
export const createUser = async (userData: CreateUserData): Promise<CustomUser> => {
  const response = await apiClient.post<ApiResponse<CustomUser>>('/api_data/user/', userData);
  return (response?.data as CustomUser) || ({} as CustomUser);
};

/**
 * Actualizar información de un usuario existente (PATCH)
 */
export const updateUser = async (id: number, userData: Partial<UpdateUserData>): Promise<CustomUser> => {
  const response = await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, userData);
  return response || ({} as CustomUser);
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api_data/user/${id}/`);
};

// ==================== FUNCIONES DE BÚSQUEDA Y FILTRADO ====================

/**
 * Buscar usuarios por diferentes criterios
 */
export const searchUsers = async (filters?: Partial<UserFilters & BaseFilters>): Promise<PaginatedApiResponse<CustomUser>> => {
  return getUsers(filters as UserFilters & BaseFilters);
};

// ==================== FUNCIONES DE GESTIÓN DE ESTADO ====================

/**
 * Activar/desactivar un usuario
 */
export const toggleUserStatus = async (id: number, isActive: boolean): Promise<CustomUser> => {
  return updateUser(id, { is_active: isActive });
};

/**
 * Verificar un usuario
 */
export const verifyUser = async (id: number): Promise<CustomUser> => {
  return updateUser(id, { is_verified: true });
};

/**
 * Cambiar rol de usuario
 */
export const changeUserRole = async (id: number, newRole: UserRole): Promise<CustomUser> => {
  return updateUser(id, { role: newRole });
};

/**
 * Actualizar profit de agente
 */
export const updateAgentProfit = async (id: number, agentProfit: number): Promise<CustomUser> => {
  return updateUser(id, { agent_profit: agentProfit });
};

// ==================== FUNCIONES DE PERFIL DE USUARIO ====================

/**
 * Obtener perfil del usuario actual (basado en el token de autenticación)
 * Utiliza el endpoint /user/ que identifica al usuario por su token
 */
export const getCurrentUserProfile = async (): Promise<CustomUser> => {
  const response = await apiClient.getCurrentUser<CustomUser>();
  return response as CustomUser || {} as CustomUser;
};

/**
 * Actualizar perfil del usuario actual
 * Utiliza el endpoint /user/ que identifica al usuario por su token
 */
export const updateCurrentUserProfile = async (userData: Partial<UpdateUserData>): Promise<CustomUser> => {
  // Usar el método específico para actualizar el perfil del usuario actual
  const response = await apiClient.updateCurrentUser<CustomUser>(userData);
  return response as CustomUser || {} as CustomUser;
};

// ==================== FUNCIONES DE ESTADÍSTICAS Y EXPORTACIÓN ====================

/**
 * Obtener estadísticas de usuarios
 */
export const getUsersStats = async (): Promise<{
  total: number;
  active: number;
  verified: number;
  by_role: Record<string, number>;
  recent_registrations: number;
}> => {
  const response = await apiClient.get<{
    total: number;
    active: number;
    verified: number;
    by_role: Record<string, number>;
    recent_registrations: number;
  }>('/api_data/user/stats/');
  return response || {
    total: 0,
    active: 0,
    verified: 0,
    by_role: {},
    recent_registrations: 0
  };
};

/**
 * Obtener usuarios recién registrados
 */
export const getRecentUsers = async (days: number = 7): Promise<PaginatedApiResponse<CustomUser>> => {
  return apiClient.getPaginated<CustomUser>(`/api_data/user/recent/?days=${days}`);
};

/**
 * Exportar lista de usuarios
 */
export const exportUsers = async (
  format: 'csv' | 'excel' = 'csv', 
  filters?: UserFilters
): Promise<Blob> => {
  const params = new URLSearchParams();
  params.append('format', format);
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  
  // Usar el método get con responseType blob
  const response = await apiClient.get<Blob>(`/api_data/user/export/?${params.toString()}`, {
    responseType: 'blob'
  });
  
  return response || new Blob();
};
