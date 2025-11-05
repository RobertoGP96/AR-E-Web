import { useQuery } from '@tanstack/react-query';
import { getDelivery } from '../../services/delivery/get-delivery';
import type { ID } from '../../types';

/**
 * Hook para obtener un delivery específico por su ID
 */
export function useSingleDelivery(id: ID) {
  const {
    data: delivery,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => getDelivery(id),
    enabled: !!id, // Solo ejecuta la query si hay un ID válido
  });

  return {
    delivery,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
