import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/api';
import type { UpdateOrderData } from '@/types';

interface UpdateOrderVariables {
  id: number;
  data: Omit<UpdateOrderData, 'id'>;
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateOrderVariables) => 
      orderService.updateOrder(id, data),
    onSuccess: () => {
      // Invalidar todas las queries de orders para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
