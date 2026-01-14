import { useQuery } from '@tanstack/react-query';
import { getPurchasesAnalysis } from '@/services/purchases/get-purchases';
import type { PurchaseAnalysisResponse } from '@/services/purchases/get-purchases';

interface UsePurchasesAnalysisProps {
  startDate?: string;
  endDate?: string;
}

export function usePurchasesAnalysis({ startDate, endDate }: UsePurchasesAnalysisProps) {
  return useQuery<PurchaseAnalysisResponse | null, Error>({
    queryKey: ['purchasesReportsAnalysis', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      const resp = await getPurchasesAnalysis({ start_date: startDate, end_date: endDate });
      return resp?.data ?? null;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}
