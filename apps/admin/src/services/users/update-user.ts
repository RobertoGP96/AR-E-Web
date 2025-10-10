/**
 * Servicio para actualizar usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { CustomUser, UpdateUserData } from '../../types';

/**
 * Actualiza un usuario existente
 */
export const updateUser = async (id: number, userData: Partial<UpdateUserData>): Promise<CustomUser> => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, userData);
};

/**
 * Actualiza el perfil del usuario actual
 */
export const updateCurrentUserProfile = async (userData: Partial<UpdateUserData>) => {
  return await apiClient.patch<CustomUser>('/user/', userData);
};

/**
 * Actualiza la información básica de un usuario
 */
export const updateUserBasicInfo = async (id: number, basicInfo: {
  name?: string;
  last_name?: string;
  phone_number?: string;
  home_address?: string;
}) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, basicInfo);
};

/**
 * Actualiza el rol de un usuario
 */
export const updateUserRole = async (id: number, role: string) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, { role });
};

/**
 * Actualiza el estado activo de un usuario
 */
export const updateUserActiveStatus = async (id: number, is_active: boolean) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, { is_active });
};

/**
 * Actualiza el estado de verificación de un usuario
 */
export const updateUserVerificationStatus = async (id: number, is_verified: boolean) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, { is_verified });
};

/**
 * Actualiza la ganancia del agente
 */
export const updateAgentProfit = async (id: number, agent_profit: number) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, { agent_profit });
};

/**
 * Cambia la contraseña de un usuario
 */
export const changeUserPassword = async (id: number, password: string) => {
  return await apiClient.patch<CustomUser>(`/api_data/user/${id}/`, { password });
};
