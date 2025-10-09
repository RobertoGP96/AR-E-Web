/**
 * Servicio de recuperación de contraseña
 */

import { apiClient } from '../../lib/api-client';

/**
 * Solicita recuperación de contraseña por email
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  return await apiClient.post<void>('/auth/password-reset/', { email });
};

/**
 * Confirma el reset de contraseña con token
 */
export const confirmPasswordReset = async (
  token: string, 
  newPassword: string
): Promise<void> => {
  return await apiClient.post<void>('/auth/password-reset-confirm/', {
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
): Promise<void> => {
  return await apiClient.post<void>('/auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword
  });
};

/**
 * Verifica si un token de reset es válido
 */
export const validateResetToken = async (token: string): Promise<{ valid: boolean }> => {
  return await apiClient.post<{ valid: boolean }>('/auth/validate-reset-token/', { token });
};
