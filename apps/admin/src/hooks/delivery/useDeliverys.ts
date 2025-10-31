import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDeliveries } from '../../services/delivery/get-deliveries';
import type { BaseFilters } from '../../types/api';

/**
 * Hook para obtener la lista de deliveries
 */
export function useDeliveries(filters?: BaseFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['deliveries', filters],
    queryFn: () => getDeliveries(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateDeliveries = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries'] });
  };

  return {
    deliveries: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateDeliveries,
  };
}