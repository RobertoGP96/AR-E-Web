import { useQuery } from "@tanstack/react-query";
import type { Order } from "@/types/models/order";
import type { ID } from "@/types/models/base";
import { apiClient } from "@/lib/api-client";

/**
 * Hook para obtener órdenes disponibles para crear deliveries de un cliente específico.
 * 
 * Una orden está disponible si:
 * - Pertenece al cliente especificado
 * - NO está cancelada
 * - NO está completada
 * - Tiene productos con cantidad pendiente de entregar (amount_purchased > amount_delivered)
 * 
 * @param clientId - ID del cliente para filtrar las órdenes
 * @param enabled - Habilitar o deshabilitar la consulta (default: true si clientId existe)
 */
export function useOrdersAvailableForDelivery(
  clientId: ID | undefined | null,
  enabled: boolean = true
) {
  return useQuery<Order[]>({
    queryKey: ["orders", "available-for-delivery", clientId],
    queryFn: async () => {
      if (!clientId) {
        return [];
      }

      const response = await apiClient.get<Order[]>(
        `/orders/available-for-delivery/`,
        {
          params: { client_id: clientId },
        }
      );
      
      return response;
    },
    enabled: enabled && !!clientId, // Solo ejecutar si está habilitado y hay clientId
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}
