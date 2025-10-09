/**
 * Servicio de registro de usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { RegisterData, CustomUser } from '../../types';

/**
 * Registra un nuevo usuario
 */
export const register = async (userData: RegisterData): Promise<CustomUser> => {
  return await apiClient.register(userData) as CustomUser;
};

/**
 * Verifica disponibilidad de email
 * Nota: Este endpoint no existe en el backend actual
 */
// export const checkEmailAvailability = async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
//   return await apiClient.post<{ available: boolean }>('/auth/check-email/', { email });
// };

/**
 * Verifica disponibilidad de teléfono
 * Nota: Este endpoint no existe en el backend actual
 */
// export const checkPhoneAvailability = async (phone: string): Promise<ApiResponse<{ available: boolean }>> => {
//   return await apiClient.post<{ available: boolean }>('/auth/check-phone/', { phone_number: phone });
// };
