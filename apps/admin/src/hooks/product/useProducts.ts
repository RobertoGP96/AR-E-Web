import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../../services/products/get-products';
import type { ProductFilters } from '../../types/api';

/**
 * Hook para obtener la lista de productos
 */
export function useProducts(filters?: ProductFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<import('../../types/api').PaginatedApiResponse<import('../../types').Product>, Error>({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return {
    products: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateProducts,
  };
}
