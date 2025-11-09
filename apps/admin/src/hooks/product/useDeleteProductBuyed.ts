import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDeleteProductBuyed() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api_data/buyed_product/${id}/`);
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['products-buyed'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });

  return {
    deleteProductBuyed: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
