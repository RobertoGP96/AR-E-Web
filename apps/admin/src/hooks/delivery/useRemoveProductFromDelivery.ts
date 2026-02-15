import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { ID } from '../../types';

interface RemoveProductFromDeliveryData {
  deliveryId: ID;
  productDeliveryId: ID;
}

/**
 * Hook para remover un producto de un delivery
 */
export function useRemoveProductFromDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemoveProductFromDeliveryData) => {
      return apiClient.delete(
        `/api_data/delivery_receips/${data.deliveryId}/remove_product/${data.productDeliveryId}/`
      );
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
