import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDelivery } from '../../services/delivery/delete-delivery';

export function useDeleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: number) => deleteDelivery(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    }
  });
}