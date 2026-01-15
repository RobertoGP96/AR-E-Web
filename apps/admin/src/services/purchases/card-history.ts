import { apiClient } from "@/lib/api-client";
import type { CardOperationsFilters, CardOperationsResponse } from "@/types/services/cardOperations";

export class CardHistoryService {
  private readonly endpoint = '/cards/operations/';

  /**
   * Obtiene el historial de transacciones de tarjetas
   */
  async getCardHistory(filters: CardOperationsFilters): Promise<CardOperationsResponse> {
    return apiClient.get<CardOperationsResponse>(this.endpoint, {params: filters});
  }
}