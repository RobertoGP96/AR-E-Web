import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderById } from '../../services/orders/get-orders';
import type { Order } from '@/types/order';

/**
 * Hook para obtener la información de una orden específica
 */
export function useOrder(orderId: number) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Order, Error>({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateOrder = () => {
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  };

  return {
    order: data,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateOrder,
  };
}
