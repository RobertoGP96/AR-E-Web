/**
 * Expected Metrics Service
 * Servicio para gestionar las métricas esperadas vs reales
 */

import { apiClient } from '@/lib/api-client';
import type {
  PaginatedApiResponse,
  BaseFilters,
} from '@/types/api';

import type { Balance, BalanceFilters, BalanceSummary, CreateBalanceData, UpdateBalanceData } from '@/types/models/balance';

const BASE_PATH = '/api_data/balance';

export const balanceService = {
  /**
   * Obtener lista de métricas esperadas con paginación
   */
  getMetrics: async (filters?: BalanceFilters): Promise<PaginatedApiResponse<Balance>> => {
    return apiClient.getPaginated(BASE_PATH + '/', filters as BaseFilters);
  },

  /**
   * Obtener una métrica por ID
   */
  getMetricById: async (id: number): Promise<Balance> => {
    return apiClient.get(`${BASE_PATH}/${id}/`);
  },

  /**
   * Crear una nueva métrica esperada
   */
  createMetric: async (data: CreateBalanceData): Promise<Balance> => {
    return apiClient.post(BASE_PATH + '/', data);
  },

  /**
   * Actualizar una métrica existente
   */
  updateMetric: async (id: number, data: UpdateBalanceData): Promise<Balance> => {
    return apiClient.patch(`${BASE_PATH}/${id}/`, data);
  },

  /**
   * Eliminar una métrica
   */
  deleteMetric: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/${id}/`);
  },


  /**
   * Obtener resumen de todas las métricas
   */
  getSummary: async (): Promise<BalanceSummary> => {
    return apiClient.get(`${BASE_PATH}/summary/`);
  },

  
};
