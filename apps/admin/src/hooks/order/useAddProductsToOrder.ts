import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * products: Array<{ shop_name: string; description: string; amount_requested: number; shop_cost: number; total_cost: number }>
 */
export function useAddProductsToOrder() {
  const queryClient = useQueryClient();

  type ProductPayload = {
    shop_name: string;
    description: string;
    amount_requested: number;
    shop_cost: number;
    total_cost: number;
  };

  return useMutation({
    mutationFn: async ({ orderId, products }: { orderId: number; products: ProductPayload[] }) => {
      for (const p of products) {
        await apiClient.post('/api_data/product/', { ...p, order: orderId });
      }
      // Refetch order
      return await apiClient.get(`/api_data/order/${orderId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
