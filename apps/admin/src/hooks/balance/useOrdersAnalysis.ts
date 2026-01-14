import { useQuery } from '@tanstack/react-query';
import { getOrderReportsAnalysis } from '@/services/orders/get-order-reports';
import type { OrderAnalysis } from '@/types/services/order';

interface UseOrdersAnalysisProps {
  startDate?: string;
  endDate?: string;
}

export function useOrdersAnalysis({ startDate, endDate }: UseOrdersAnalysisProps) {
  return useQuery<OrderAnalysis | null, Error>({
    queryKey: ['orderReportsAnalysis', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      const resp = await getOrderReportsAnalysis({ start_date: startDate, end_date: endDate });
      return resp?.data ?? null;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}
