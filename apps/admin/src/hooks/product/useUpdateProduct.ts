import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Product, UpdateProductData } from "@/types/models";

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductData) => {
      const { id, ...updateData } = data;
      const response = await apiClient.patch<Product>(`/api_data/product/${id}/`, updateData);
      return response;
    },
    onSuccess: (updatedProduct) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", updatedProduct.id] });
      
      // Si el producto tiene un order, invalidar también las queries de ese order
      if (updatedProduct.order) {
        const orderId = typeof updatedProduct.order === 'number' 
          ? updatedProduct.order 
          : updatedProduct.order.id;
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });
};
