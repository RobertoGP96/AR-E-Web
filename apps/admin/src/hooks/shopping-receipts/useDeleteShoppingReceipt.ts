import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteShoppingReceipt } from '@/services/shopping-receipts/delete-shopping-receipt';

export function useDeleteShoppingReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiptId: number) => deleteShoppingReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-receipts'] });
    }
  });
}