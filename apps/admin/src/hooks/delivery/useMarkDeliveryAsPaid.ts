import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markDeliveryAsPaid } from '@/services/delivery/update-delivery';

interface MarkDeliveryAsPaidVariables {
  deliveryId: number;
  amountReceived?: number;
  paymentDate?: Date;
}

export function useMarkDeliveryAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, amountReceived, paymentDate }: MarkDeliveryAsPaidVariables) => {
      
      if (!deliveryId || deliveryId === undefined) {
        throw new Error('Delivery ID is undefined');
      }
      
      return markDeliveryAsPaid(deliveryId, amountReceived, paymentDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
    onError: (error) => {
      console.error('[useMarkDeliveryAsPaid] Error en la mutación:', error);
    }
  });
}
