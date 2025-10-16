/**
 * Servicio de registro de usuario
 */

import type { ApiResponse, RegisterData } from '@/types/api';
import type { CustomUser } from '@/types/user';
import { apiClient, ApiError } from '@/lib';

/**
 * Datos del usuario registrado
 */
export interface RegisterResponse {
  user_id: number;
  email: string;
  name: string;
  last_name: string;
  home_address: string;
  phone_number: string;
  role: string;
  agent_profit: number;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  sent_verification_email: boolean;
  date_joined: string;
}

/**
 * Registra un nuevo usuario
 * Endpoint: POST /api_data/user/
 */
export const register = async (userData: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
  try {
    // Preparar los datos de registro, excluyendo el email si está vacío
    const registrationData = {
      ...userData,
      role: 'client',
      is_active: true
    };

    // Solo incluir email si tiene valor
    if (!userData.email || userData.email.trim() === '') {
      delete registrationData.email;
    }

    const response = await apiClient.post<ApiResponse<RegisterResponse>>('/api_data/user/', registrationData);

    return response;
  } catch (error) {
    const apiError = error as ApiError;
    throw {
      success: false,
      message: apiError.message || 'Error al registrar usuario',
      errors: apiError.details ? [{ message: apiError.message, code: apiError.code }] : []
    };
  }
};

/**
 * Verifica el correo electrónico del usuario
 * Endpoint: GET /verify_user/{verification_secret}
 */
export const verifyEmail = async (verificationSecret: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    const response = await apiClient.get<{ message: string }>(`/verify_user/${verificationSecret}`);

    return {
      success: true,
      data: response,
      message: 'Correo verificado exitosamente'
    };
  } catch (error) {
    const apiError = error as ApiError;
    throw {
      success: false,
      message: apiError.message || 'Error al verificar correo',
      errors: apiError.details ? [{ message: apiError.message, code: apiError.code }] : []
    };
  }
};

/**
 * Verifica si un email ya está registrado
 * Consulta directa a la base de usuarios
 */
export const checkEmailAvailability = async (email: string): Promise<ApiResponse<{ available: boolean }>> => {
  try {
    // Buscamos usuarios con ese email
    const response = await apiClient.get<CustomUser[]>(`/api_data/user/?email=${encodeURIComponent(email)}`);

    const available = !response || response.length === 0;

    return {
      success: true,
      data: { available },
      message: available ? 'Email disponible' : 'Email ya registrado'
    };
  } catch {
    // Si hay error en la consulta, asumimos que está disponible
    return {
      success: true,
      data: { available: true },
      message: 'Email disponible'
    };
  }
};

/**
 * Verifica si un número de teléfono ya está registrado
 * Consulta directa a la base de usuarios
 */
export const checkPhoneAvailability = async (phoneNumber: string): Promise<ApiResponse<{ available: boolean }>> => {
  try {
    // Buscamos usuarios con ese número de teléfono
    const response = await apiClient.get<CustomUser[]>(`/api_data/user/?phone_number=${encodeURIComponent(phoneNumber)}`);

    const available = !response || response.length === 0;

    return {
      success: true,
      data: { available },
      message: available ? 'Número disponible' : 'Número ya registrado'
    };
  } catch {
    // Si hay error en la consulta, asumimos que está disponible
    return {
      success: true,
      data: { available: true },
      message: 'Número disponible'
    };
  }
};
