import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

/**
 * Interfaz para un evento de timeline
 */
export interface TimelineEvent {
  status: 'created' | 'purchased' | 'received' | 'delivered';
  date: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  isCompleted: boolean;
}

/**
 * Interfaz para la respuesta de timeline
 */
export interface ProductTimelineResponse {
  id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  events: TimelineEvent[];
}

/**
 * Hook para obtener los datos de la timeline de un producto
 * Retorna eventos ya formateados listos para renderizar
 */
export function useProductTimeline(productId: string) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ProductTimelineResponse, Error>({
    queryKey: ['product-timeline', productId],
    queryFn: async () => {
      return await apiClient.get<ProductTimelineResponse>(`/api_data/product/${productId}/timeline/`);
    },
    enabled: !!productId,
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateTimeline = () => {
    queryClient.invalidateQueries({ queryKey: ['product-timeline', productId] });
  };

  return {
    timeline: data ?? null,
    events: data?.events ?? [],
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateTimeline,
  };
}
