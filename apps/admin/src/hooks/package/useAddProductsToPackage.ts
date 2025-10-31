/**
 * Hook para agregar productos recibidos a un paquete
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface AddProductsToPackageData {
  original_product: number;
  amount_received: number;
}

/**
 * Hook para agregar productos recibidos a un paquete
 */
export function useAddProductsToPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, products }: { packageId: number; products: AddProductsToPackageData[] }) =>
      apiClient.post(`/api_data/package/${packageId}/add_products/`, {
        products
      }),
    onSuccess: () => {
      // Invalidar el cache de paquetes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });
}