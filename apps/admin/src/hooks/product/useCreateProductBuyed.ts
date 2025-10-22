import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProductBuyed } from '../../services/products/create-product-buyed';
import type { CreateProductBuyedData, ProductBuyed } from '../../types/models/product-buyed';

/**
 * Hook para crear un producto comprado
 */
export function useCreateProductBuyed() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ProductBuyed, Error, CreateProductBuyedData>({
    mutationFn: createProductBuyed,
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-buyed'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    createProductBuyed: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}