import { useQuery } from '@tanstack/react-query';
import { getDeliveryReportsAnalysis } from '@/services/delivery/get-deliveries';
import type { DeliveryAnalysisResponse } from '@/types/services/delivery';


interface UseDeliveryAnalysisProps {
  startDate?: string;
  endDate?: string;
}

export function useDeliveryAnalysis({ startDate, endDate }: UseDeliveryAnalysisProps) {
  return useQuery<DeliveryAnalysisResponse | null, Error>({
    queryKey: ['deliveryReportsAnalysis', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      const resp = await getDeliveryReportsAnalysis({ start_date: startDate, end_date: endDate });
      return resp?.data ?? null;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
  });
}
