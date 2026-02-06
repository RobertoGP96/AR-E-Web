import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePackage } from '@/services/packages/delete-package';

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packageId: number) => deletePackage(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-received'] });
    }
  });
}