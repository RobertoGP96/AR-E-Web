import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markOrderAsPaid } from '@/services/orders/update-order';

interface MarkOrderAsPaidVariables {
  orderId: number;
  amountReceived?: number;
}

export function useMarkOrderAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, amountReceived }: MarkOrderAsPaidVariables) => {
      
      if (!orderId || orderId === undefined) {
        throw new Error('Order ID is undefined');
      }
      
      return markOrderAsPaid(orderId, amountReceived);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('[useMarkOrderAsPaid] Error en la mutación:', error);
    }
  });
}
