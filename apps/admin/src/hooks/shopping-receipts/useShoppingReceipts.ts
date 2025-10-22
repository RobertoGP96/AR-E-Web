import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getShoppingReceipts } from '../../services/shopping-receipts/get-shopping-receipts';
import type { ShoppingReceipFilters } from '../../types/api';

/**
 * Hook para obtener la lista de recibos de compra
 */
export function useShoppingReceipts(filters?: ShoppingReceipFilters) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<import('../../types/api').PaginatedApiResponse<import('../../types').ShoppingReceip>, Error>({
    queryKey: ['shopping-receipts', filters],
    queryFn: () => getShoppingReceipts(filters),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateShoppingReceipts = () => {
    queryClient.invalidateQueries({ queryKey: ['shopping-receipts'] });
  };

  return {
    shoppingReceipts: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateShoppingReceipts,
  };
}