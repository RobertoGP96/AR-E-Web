import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateProductData } from '@/services/products/create-product';

/**
 * products: Array<{ shop_name: string; description: string; amount_requested: number; shop_cost: number; total_cost: number }>
 */
export function useAddProductsToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, products }: { orderId: number; products: CreateProductData[] }) => {
      for (const p of products) {
        const { shop_id, shop_name, ...rest } = p as Partial<CreateProductData>;
        const payload: Record<string, unknown> = {
          ...rest,
          order: orderId,
        };
        if (typeof shop_id !== 'undefined') payload.shop = shop_id;
        else if (typeof shop_name !== 'undefined') payload.shop = shop_name;

        await apiClient.post('/api_data/product/', payload);
      }
      // Refetch order
      return await apiClient.get(`/api_data/order/${orderId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
