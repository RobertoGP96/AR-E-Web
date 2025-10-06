/**
 * Servicio de gestión de tokens
 */

import type { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib';

/**
 * Refresca el token de acceso usando el refresh token
 */
export const refreshToken = async (): Promise<ApiResponse<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}>> => {
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
  
  if (response.data) {
    // Actualizar tokens en localStorage
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
    
    // Actualizar token en el cliente API
    apiClient.setAuthToken(response.data.access_token);
  }
  
  return response;
};

/**
 * Verifica si el token actual es válido
 * NOTA: Este endpoint no está implementado en el backend actual
 */
export const verifyToken = async (): Promise<ApiResponse<{ valid: boolean }>> => {
  // Endpoint no disponible - usar el endpoint de seguridad en su lugar
  return await apiClient.get<{ valid: boolean }>('/security/');
};

/**
 * Invalida el token actual
 * NOTA: Este endpoint no está implementado en el backend actual
 */
export const blacklistToken = async (): Promise<ApiResponse<void>> => {
  // Endpoint no disponible - usar logout del contexto en su lugar
  throw new Error('Endpoint not implemented. Use logout from AuthContext instead.');
};
