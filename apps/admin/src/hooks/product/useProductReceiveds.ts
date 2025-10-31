import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductReceiveds } from '../../services/products/product-received';
import type { ProductReceivedFilters } from '../../types/api';

/**
 * Hook para obtener la lista de productos recibidos
 */
export function useProductReceiveds(filters?: ProductReceivedFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['product-received', filters],
    queryFn: () => getProductReceiveds(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateProductReceiveds = () => {
    queryClient.invalidateQueries({ queryKey: ['product-received'] });
  };

  return {
    productReceiveds: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateProductReceiveds,
  };
}