/**
 * Servicio de registro de usuario
 */

import type { ApiResponse, RegisterData } from '@/types/api';
import { apiClient } from '@/lib/api-client';

/**
 * Registra un nuevo usuario
 */
export const register = async (userData: RegisterData): Promise<ApiResponse<unknown>> => {
  return await apiClient.register(userData);
};

/**
 * Verifica disponibilidad de email
 */
export const checkEmailAvailability = async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
  return await apiClient.post<{ available: boolean }>('/auth/check-email/', { email });
};

/**
 * Verifica disponibilidad de teléfono
 */
export const checkPhoneAvailability = async (phone: string): Promise<ApiResponse<{ available: boolean }>> => {
  return await apiClient.post<{ available: boolean }>('/auth/check-phone/', { phone_number: phone });
};
