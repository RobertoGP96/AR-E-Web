import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markOrderAsPaid } from '@/services/orders/update-order';

export function useMarkOrderAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => markOrderAsPaid(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
