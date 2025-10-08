import { useQuery, useQueryClient } from '@tanstack/react-query';
import { shopsService } from '../../services/shops/shops.service';
import type { ShopFilters } from '../../services/shops/shops.service';

/**
 * Hook para obtener la lista de tiendas (shops)
 */
export function useShops(filters?: ShopFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<import('../../types/api').PaginatedApiResponse<import('../../types/models/shop').Shop>, Error>({
    queryKey: ['shops', filters],
    queryFn: () => shopsService.getShops(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateShops = () => {
    queryClient.invalidateQueries({ queryKey: ['shops'] });
  };

  return {
    shops: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateShops,
  };
}
