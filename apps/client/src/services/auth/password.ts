/**
 * Servicios de gestión de contraseñas
 */

import type { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib';

/**
 * Solicita recuperación de contraseña por email
 */
export const requestPasswordReset = async (email: string): Promise<ApiResponse<void>> => {
  return await apiClient.post<ApiResponse<void>>('/auth/password-reset/', { email });
};

/**
 * Confirma el reset de contraseña con token
 */
export const confirmPasswordReset = async (
  token: string, 
  newPassword: string
): Promise<ApiResponse<void>> => {
  return await apiClient.post<ApiResponse<void>>('/auth/password-reset-confirm/', {
    token,
    new_password: newPassword
  });
};

/**
 * Cambia la contraseña del usuario autenticado
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<void>> => {
  return await apiClient.post<ApiResponse<void>>('/auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword
  });
};

/**
 * Verifica si un token de reset es válido
 */
export const validateResetToken = async (token: string): Promise<ApiResponse<{ valid: boolean }>> => {
  return await apiClient.post<ApiResponse<{ valid: boolean }>>('/auth/validate-reset-token/', { token });
};
