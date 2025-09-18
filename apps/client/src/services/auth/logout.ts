/**
 * Servicio de logout y gestión de sesión
 */

import type { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib/api-client.ts';

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
    localStorage.removeItem('user');
    
    // Limpiar token del cliente API
    apiClient.clearAuthToken();
  }
};

/**
 * Cierra todas las sesiones del usuario
 */
export const logoutAllSessions = async (): Promise<ApiResponse<void>> => {
  const response = await apiClient.post<void>('/auth/logout-all/');
  
  // Limpiar datos locales
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  apiClient.clearAuthToken();
  
  return response;
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
 * Obtiene la información del usuario del localStorage
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};
