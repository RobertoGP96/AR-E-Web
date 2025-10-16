/**
 * Servicio de logout y limpieza de sesión
 */

import { apiClient } from '@/lib';
import type { ApiResponse } from '@/types/api';

/**
 * Cierra sesión del usuario actual
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.logout();
  } finally {
    // Limpiar datos locales siempre, incluso si la API falla
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Limpiar token del cliente API
    apiClient.clearAuthToken();
  }
};

/**
 * Cierra todas las sesiones del usuario
 */
export const logoutAllSessions = async (): Promise<void> => {
  await apiClient.post<ApiResponse<void>>('/auth/logout-all/');

  // Limpiar datos locales
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  apiClient.clearAuthToken();
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return apiClient.isAuthenticated();
};

/**
 * Obtiene el token actual del localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Obtiene el refresh token del localStorage
 */
export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * Obtiene la información del usuario actual usando el contexto de autenticación
 * @deprecated Use el hook useAuth() para obtener información del usuario
 */
export const getCurrentUserFromContext = async () => {
  try {
    const response = await apiClient.getCurrentUser();
    return response;
  } catch  {
    // Error obteniendo usuario actual
    return null;
  }
};
