/**
 * Hook para crear órdenes con TanStack Query
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrderAnalysis } from '@/types/services/order';
import { getOrderReportsAnalysis } from '@/services/orders/get-order-reports';

/**
 * Hook para crear una nueva orden
 */
export function useCreateOrder({start, end}:{start: string, end: string}) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<OrderAnalysis, Error>({
    queryKey: ['order-analysis', start, end],

    queryFn: async ()  => getOrderReportsAnalysis({ start_date: start, end_date: end }),
  });

  const invalidateOrdersAnalysis = () => {
    queryClient.invalidateQueries({ queryKey: ['order-analysis'] });
  };

  return {
    ordersData: data,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateOrdersAnalysis
  };
}
