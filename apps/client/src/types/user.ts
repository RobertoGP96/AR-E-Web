import { UserRole } from './base';

// Re-exportar tipos existentes para compatibilidad
export type { CustomUser, UserRole, UpdateUserData, CreateUserData } from './user.d';

// Interfaces específicas para el perfil del usuario
export interface UpdateProfileData {
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  home_address?: string;
  role?: UserRole;
}

export interface UserProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}