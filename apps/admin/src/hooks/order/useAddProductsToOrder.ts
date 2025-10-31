import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateProductData } from '@/types/models';


/**
 * products: Array<{ shop_name: string; description: string; amount_requested: number; shop_cost: number; total_cost: number }>
 */
export function useAddProductsToOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, products }: { orderId: number; products: CreateProductData[] }) => {
      for (const p of products) {
        const { shop_id, ...rest } = p as Partial<CreateProductData>;
        const payload: Record<string, unknown> = {
          ...rest,
          order: orderId,
        };
        if (typeof shop_id !== 'undefined') payload.shop = shop_id;

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
