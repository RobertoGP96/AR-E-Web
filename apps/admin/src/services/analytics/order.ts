/**
 * Expected Metrics Service
 * Servicio para gestionar las métricas esperadas vs reales
 */

import { apiClient } from "@/lib/api-client";
import type { PaginatedApiResponse, BaseFilters } from "@/types/api";
import type { Balance, BalanceFilters } from "@/types/models";


const BASE_PATH = "/api_data/balance";

export const ordersAnalysisService = {
  getMetrics: async (
    filters?: BalanceFilters
  ): Promise<PaginatedApiResponse<Balance>> => {
    return apiClient.getPaginated(BASE_PATH + "/", filters as BaseFilters);
  },
};
