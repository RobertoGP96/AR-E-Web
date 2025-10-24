import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getShoppingReceiptById } from '../../services/shopping-receipts/get-shopping-receipts';
import type { ShoppingReceip } from '../../types';

/**
 * Hook para obtener la información de un recibo de compra específico
 */
export function useShoppingReceipt(shoppingReceiptId: number) {
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ShoppingReceip, Error>({
    queryKey: ['shopping-receipt', shoppingReceiptId],
    queryFn: () => getShoppingReceiptById(shoppingReceiptId),
    enabled: !!shoppingReceiptId,
  });

  // Función para invalidar la cache y forzar refetch
  const invalidateShoppingReceipt = () => {
    queryClient.invalidateQueries({ queryKey: ['shopping-receipt', shoppingReceiptId] });
  };

  return {
    shoppingReceipt: data,
    isLoading,
    isFetching,
    error,
    refetch,
    invalidateShoppingReceipt,
  };
}