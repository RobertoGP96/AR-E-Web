/**
 * Hook para actualizar deliveries con TanStack Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDelivery, updateDeliveryStatus } from '../../services/delivery/update-delivery';
import type { UpdateDeliverReceipData } from '../../types/models/delivery';

/**
 * Hook para actualizar un delivery
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeliverReceipData }) => updateDelivery(id, data),
    onSuccess: () => {
      // Invalidar el cache de la lista de deliveries
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

/**
 * Hook para actualizar el estado de un delivery
 */
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateDeliveryStatus(id, status),
    onSuccess: () => {
      // Invalidar el cache de la lista de deliveries
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}