import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingReceipService } from '@/services/api';

export function useUpdateShoppingReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import('@/types').ShoppingReceip> }) =>
      shoppingReceipService.updateShoppingReceipt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-receipts'] });
    }
  });
}