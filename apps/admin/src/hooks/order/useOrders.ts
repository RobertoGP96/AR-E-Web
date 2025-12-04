import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders } from '../../services/orders/get-orders';
import type { OrderFilters, PaginatedApiResponse } from '../../types/api';
import type { Order } from '@/types/models';

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
    queryFn: () => getOrders(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return {
    orders: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateOrders,
  };
}
