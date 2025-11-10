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
      console.log(`[useMarkOrderAsPaid] mutationFn llamada con:`, { orderId, amountReceived });
      
      if (!orderId || orderId === undefined) {
        console.error('[useMarkOrderAsPaid] ERROR: orderId es undefined', { orderId, amountReceived });
        throw new Error('Order ID is undefined');
      }
      
      return markOrderAsPaid(orderId, amountReceived);
    },
    onSuccess: () => {
      console.log('[useMarkOrderAsPaid] Pago confirmado exitosamente, invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('[useMarkOrderAsPaid] Error en la mutación:', error);
    }
  });
}
