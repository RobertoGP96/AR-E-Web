import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markDeliveryAsPaid } from '@/services/delivery/update-delivery';

interface MarkDeliveryAsPaidVariables {
  deliveryId: number;
  amountReceived?: number;
  paymentDate?: Date;
  paymentStatus?: string;
  appliedBalance?: number;
}

export function useMarkDeliveryAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deliveryId, amountReceived, paymentDate, paymentStatus, appliedBalance }: MarkDeliveryAsPaidVariables) => {
      
      if (!deliveryId || deliveryId === undefined) {
        throw new Error('Delivery ID is undefined');
      }
      
      return markDeliveryAsPaid(deliveryId, amountReceived, paymentDate, paymentStatus, appliedBalance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['clientBalances'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryReportsAnalysis'] });
    },
    onError: (error) => {
      console.error('[useMarkDeliveryAsPaid] Error en la mutación:', error);
    }
  });
}
