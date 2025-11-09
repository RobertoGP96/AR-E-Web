import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/api';
import type { ProductBuyed } from '@/types/models';

interface UseProductsBuyedParams {
  productId?: number;
  shoppingReceiptId?: number;
}

export function useProductsBuyed(params: UseProductsBuyedParams = {}) {
  const { productId, shoppingReceiptId } = params;

  const query = useQuery<ProductBuyed[], Error>({
    queryKey: ['products-buyed', params],
    queryFn: async () => {
      // Construir filtros dinámicamente
      const filters: Record<string, string | number> = {};
      
      if (productId) {
        filters.original_product = productId;
      }
      
      if (shoppingReceiptId) {
        filters.shopping_receip = shoppingReceiptId;
      }

      const response = await productService.getBuyedProducts(filters);
      return response.results || [];
    },
    enabled: !!(productId || shoppingReceiptId),
  });

  return {
    productsBuyed: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
