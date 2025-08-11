/**
 * Servicios de verificación de usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Envía email de verificación a un usuario
 */
export const sendVerificationEmail = async (userId: number): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>(`/users/${userId}/send-verification/`);
};

/**
 * Verifica el email de un usuario con token
 */
export const verifyUserEmail = async (token: string): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/users/verify-email/', { token });
};

/**
 * Marca un usuario como verificado manualmente (admin)
 */
export const manuallyVerifyUser = async (userId: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/users/${userId}/`, { is_verified: true });
};

/**
 * Reenvía email de verificación
 */
export const resendVerificationEmail = async (email: string): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/users/resend-verification/', { email });
};
