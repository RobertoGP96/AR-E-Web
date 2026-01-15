import { useQuery } from '@tanstack/react-query';
import { CardHistoryService } from '@/services/purchases/card-history';
import type { CardOperationsFilters, CardOperationsResponse } from '@/types/services/cardOperations';

const cardHistoryService = new CardHistoryService();

export function useCardHistory(filters: CardOperationsFilters) {
  return useQuery<CardOperationsResponse, Error>({
    queryKey: ['cardHistory', filters],
    queryFn: () => cardHistoryService.getCardHistory(filters),
    enabled: !!filters.startDate && !!filters.endDate, // Only fetch when we have both dates
    staleTime: 5 * 60 * 1000, // 5 minutes before data becomes stale
    refetchOnWindowFocus: false,
  });
}
