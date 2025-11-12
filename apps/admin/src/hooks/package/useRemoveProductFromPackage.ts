import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ID } from '@/types';

interface RemoveProductFromPackageData {
  packageId: ID;
  productReceivedId: ID;
}

/**
 * Hook para remover un producto recibido de un paquete
 */
export function useRemoveProductFromPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemoveProductFromPackageData) => {
      return apiClient.delete(
        `/api_data/package/${data.packageId}/remove_product/${data.productReceivedId}/`
      );
    },
    onSuccess: (_, variables) => {
      // Invalidar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['package', variables.packageId] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
