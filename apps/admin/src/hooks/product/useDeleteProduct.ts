import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProduct } from '@/services/products/delete-product';

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string | number) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export default useDeleteProduct;
