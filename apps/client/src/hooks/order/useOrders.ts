import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrders } from '../../services/orders/get-orders';
import type { OrderFilters } from '../../types/api';

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
  } = useQuery<import('../../types/api').PaginatedApiResponse<import('../../types').Order>, Error>({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
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
