import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { ID, UUID } from '../../types';

interface AddProductToDeliveryData {
  deliveryId: ID;
  productId: UUID;
  amount: number;
}

/**
 * Hook para agregar un producto a un delivery
 */
export function useAddProductToDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddProductToDeliveryData) => {
      return apiClient.post(`/api_data/delivery_receips/${data.deliveryId}/add_products/`, {
        products: [{
          original_product: data.productId,
          amount_delivered: data.amount,
        }]
      });
    },
    onSuccess: (_, variables) => {
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['delivery', variables.deliveryId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['clientBalances'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryReportsAnalysis'] });
    },
  });
}
