/**
 * Servicio de login y autenticación
 */

import { apiClient } from '../../lib/api-client';
import type { LoginCredentials, AuthResponse } from '../../types';

/**
 * Inicia sesión con email y contraseña
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.login(credentials);
  
  // Guardar tokens en localStorage
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('refresh_token', response.refresh_token);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  return response;
};

/**
 * Verifica las credenciales sin iniciar sesión completa
 * Nota: Este endpoint no existe en el backend actual
 */
// export const verifyCredentials = async (credentials: LoginCredentials): Promise<ApiResponse<boolean>> => {
//   return await apiClient.post<boolean>('/auth/verify-credentials/', credentials);
// };

/**
 * Login con token de terceros (Google, Facebook, etc.)
 * Nota: Este endpoint no existe en el backend actual
 */
// export const loginWithProvider = async (provider: string, token: string): Promise<ApiResponse<AuthResponse>> => {
//   return await apiClient.post<AuthResponse>('/auth/social-login/', {
//     provider,
//     access_token: token
//   });
// };
