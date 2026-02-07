/**
 * Hook para actualizar paquetes con TanStack Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePackage, updatePackageStatus, type UpdatePackageData } from '../../services/packages/update-package';

/**
 * Hook para actualizar un paquete
 */
export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePackageData }) => updatePackage(id, data),
    onSuccess: () => {
      // Invalidar el cache de la lista de paquetes
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-received'] });
    },
  });
}

/**
 * Hook para actualizar el estado de un paquete
 */
export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updatePackageStatus(id, status),
    onSuccess: () => {
      // Invalidar el cache de la lista de paquetes
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-received'] });
    },
  });
}
    