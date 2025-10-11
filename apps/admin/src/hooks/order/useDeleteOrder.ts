import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOrder } from '@/services/orders/delete-order';

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
}
