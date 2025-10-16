/**
 * Servicio de login y autenticación
 */

import type { ApiResponse, AuthResponse, LoginCredentials } from '@/types/api';
import { apiClient } from '@/lib';

/**
 * Inicia sesión con email y contraseña
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.login(credentials);
  
  // Guardar tokens en localStorage
  localStorage.setItem('access_token', response.access);
  localStorage.setItem('refresh_token', response.refresh);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  return response;
};

/**
 * Verifica las credenciales sin iniciar sesión completa
 */
export const verifyCredentials = async (credentials: LoginCredentials): Promise<ApiResponse<boolean>> => {
  return await apiClient.post<ApiResponse<boolean>>('/auth/verify-credentials/', credentials);
};

/**
 * Login con token de terceros (Google, Facebook, etc.)
 */
export const loginWithProvider = async (provider: string, token: string): Promise<ApiResponse<AuthResponse>> => {
  return await apiClient.post<ApiResponse<AuthResponse>>('/auth/social-login/', {
    provider,
    access_token: token
  });
};
