/**
 * Hook para agregar productos recibidos a un paquete
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateProductReceivedData } from '@/types';

export interface AddProductsToPackageData {
  original_product: string; // UUID del producto
  amount_received: number;
}

/**
 * Hook para agregar productos recibidos a un paquete
 */
export function useAddProductsToPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, products }: { packageId: number; products: CreateProductReceivedData[] }) =>
      apiClient.post(`/api_data/package/${packageId}/add_products/`, {
        products
      }),
    onSuccess: () => {
      // Invalidar el cache de paquetes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-received'] });
    },
  });
}