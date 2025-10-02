import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrdersByClient } from '../../services/orders/get-orders';
import type { Order, OrderFilters } from '@/types/order';
import type { PaginatedApiResponse } from '@/types/api';

/**
 * Hook para obtener la lista de órdenes
 */
export function useOrders(filters?: OrderFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<PaginatedApiResponse<Order>, Error>({
    queryKey: ['orders', filters],
    queryFn: () => getOrdersByClient(filters?.client_id as number, filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders-client'] });
  };

  return {
    orders: data?.data ?? [],
    total: data?.pagination?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateOrders,
  };
}
