/**
 * Servicios de verificación de usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { ApiResponse } from '../../types';

/**
 * Envía email de verificación a un usuario
 * Nota: Este endpoint no existe en el backend actual
 */
// export const sendVerificationEmail = async (userId: number): Promise<ApiResponse<void>> => {
//   return await apiClient.post<void>(`/api_data/user/${userId}/send-verification/`);
// };

/**
 * Verifica el email de un usuario con token
 * Usa el endpoint correcto del backend: /verify_user/{verification_secret}
 */
export const verifyUserEmail = async (verificationSecret: string): Promise<ApiResponse<{ message: string }>> => {
  return await apiClient.get<{ message: string }>(`/verify_user/${verificationSecret}`);
};

/**
 * Marca un usuario como verificado manualmente (admin)
 */
export const manuallyVerifyUser = async (userId: number): Promise<ApiResponse<void>> => {
  return await apiClient.patch<void>(`/api_data/user/${userId}/`, { is_verified: true });
};

/**
 * Reenvía email de verificación
 * Nota: Este endpoint no existe en el backend actual
 */
// export const resendVerificationEmail = async (email: string): Promise<ApiResponse<void>> => {
//   return await apiClient.post<void>('/users/resend-verification/', { email });
// };
