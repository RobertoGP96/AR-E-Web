/**
 * Servicio para crear usuarios
 */

import { apiClient } from '../../lib/api-client';
import type { CustomUser, CreateUserData, ApiResponse } from '../../types';

/**
 * Crea un nuevo usuario
 */
export const createUser = async (userData: CreateUserData): Promise<ApiResponse<CustomUser>> => {
  return await apiClient.post<CustomUser>('/api_data/user/', userData);
};

/**
 * Registra un nuevo agente
 */
export const createAgent = async (userData: Omit<CreateUserData, 'role'>) => {
  const agentData = { ...userData, role: 'agent' as const };
  return await apiClient.post<CustomUser>('/api_data/user/', agentData);
};

/**
 * Registra un nuevo contador
 */
export const createAccountant = async (userData: Omit<CreateUserData, 'role'>) => {
  const accountantData = { ...userData, role: 'accountant' as const };
  return await apiClient.post<CustomUser>('/api_data/user/', accountantData);
};

/**
 * Registra un nuevo comprador
 */
export const createBuyer = async (userData: Omit<CreateUserData, 'role'>) => {
  const buyerData = { ...userData, role: 'buyer' as const };
  return await apiClient.post<CustomUser>('/api_data/user/', buyerData);
};

/**
 * Registra un nuevo logístico
 */
export const createLogistical = async (userData: Omit<CreateUserData, 'role'>) => {
  const logisticalData = { ...userData, role: 'logistical' as const };
  return await apiClient.post<CustomUser>('/api_data/user/', logisticalData);
};

/**
 * Registra un nuevo community manager
 */
export const createCommunityManager = async (userData: Omit<CreateUserData, 'role'>) => {
  const cmData = { ...userData, role: 'community_manager' as const };
  return await apiClient.post<CustomUser>('/api_data/user/', cmData);
};
