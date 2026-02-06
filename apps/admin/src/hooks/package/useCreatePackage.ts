/**
 * Hook para crear paquetes con TanStack Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPackage } from '../../services/packages/create-package';
import type { CreatePackageData } from '../../services/packages/create-package';

/**
 * Hook para crear un nuevo paquete
 */
export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packageData: CreatePackageData) => createPackage(packageData),
    onSuccess: () => {
      // Invalidar el cache de la lista de paquetes
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-received'] });
    },
  });
}