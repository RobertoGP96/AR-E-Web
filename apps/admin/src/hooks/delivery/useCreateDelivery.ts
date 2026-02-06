/**
 * Hook para crear deliveries con TanStack Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDelivery } from '../../services/delivery/create-delivery';
import type { CreateDeliverReceipData } from '../../types/models/delivery';

/**
 * Hook para crear un nuevo delivery
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryData: CreateDeliverReceipData) => createDelivery(deliveryData),
    onSuccess: () => {
      // Invalidar el cache de la lista de deliveries
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      // Invalidar queries de productos para refrescar estados
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}