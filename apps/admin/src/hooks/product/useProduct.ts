import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductById } from '@/services/products/get-products';
import type { Product } from '@/types';

/**
 * Hook para obtener un producto por ID
 */
export function useProduct(id: string) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Product, Error>({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateProduct = () => {
    queryClient.invalidateQueries({ queryKey: ['product', id] });
  };

  return {
    product: data ?? null,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateProduct,
  };
}
