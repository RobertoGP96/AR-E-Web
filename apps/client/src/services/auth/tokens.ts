/**
 * Servicio de gestión de tokens
 */

import { apiClient } from '@/lib';
import type { ApiResponse } from '@/types/api';

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
  
  const response = await apiClient.post<ApiResponse<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>>('/auth/refresh/', {
    refresh: refreshToken
  });

  if (response && response.data) {
    // Actualizar tokens en localStorage (soportar diferentes nombres)
    const data = response.data as Record<string, unknown>;
    const access = (data.access as string) || (data.access_token as string) || '';
    const refresh = (data.refresh as string) || (data.refresh_token as string) || '';

    if (access) {
      try {
        localStorage.setItem('access_token', access);
        try { localStorage.setItem('access', access); } catch { /* silent */ }
      } catch { /* silent */ }
      apiClient.setAuthToken(access);
    }

    if (refresh) {
      try {
        localStorage.setItem('refresh_token', refresh);
        try { localStorage.setItem('refresh', refresh); } catch { /* silent */ }
      } catch { /* silent */ }
    }
  }

  return response?.data as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
};

/**
 * Verifica si el token actual es válido
 * NOTA: Este endpoint no está implementado en el backend actual
 */
export const verifyToken = async (): Promise<{ valid: boolean }> => {
  // Endpoint no disponible - usar el endpoint de seguridad en su lugar
  return await apiClient.get<{ valid: boolean }>('/security/');
};

/**
 * Invalida el token actual
 * NOTA: Este endpoint no está implementado en el backend actual
 */
export const blacklistToken = async (): Promise<void> => {
  // Endpoint no disponible - usar logout del contexto en su lugar
  throw new Error('Endpoint not implemented. Use logout from AuthContext instead.');
};
