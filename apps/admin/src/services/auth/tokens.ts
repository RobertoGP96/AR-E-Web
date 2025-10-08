/**
 * Servicio de gestión de tokens
 */

import { apiClient } from '../../lib/api-client';

/**
 * Refresca el token de acceso usando el refresh token
 */
export const refreshToken = async (): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await apiClient.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>('/auth/refresh/', {
    refresh: refreshToken
  });
  
  // Actualizar tokens en localStorage
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('refresh_token', response.refresh_token);
  
  // Actualizar token en el cliente API
  apiClient.setAuthToken(response.access_token);
  
  return response;
};

/**
 * Verifica si el token actual es válido
 * Nota: Este endpoint no existe en el backend actual
 */
// export const verifyToken = async (): Promise<{ valid: boolean }> => {
//   return await apiClient.post<{ valid: boolean }>('/auth/token/verify/');
// };

/**
 * Invalida el token actual
 * Nota: Este endpoint no existe en el backend actual
 */
// export const blacklistToken = async (): Promise<void> => {
//   return await apiClient.post<void>('/auth/token/blacklist/');
// };
