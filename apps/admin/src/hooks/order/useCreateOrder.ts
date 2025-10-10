/**
 * Hook para crear órdenes con TanStack Query
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, createOrderWithProducts, createQuickOrder } from '@/services/orders/create-order';
import type { CreateOrderData } from '@/services/orders/create-order';

/**
 * Hook para crear una nueva orden
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderData) => createOrder(orderData),
    onSuccess: () => {
      // Invalidar el cache de la lista de órdenes
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook para crear una orden rápida
 */
export function useCreateQuickOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientEmail: string) => createQuickOrder(clientEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook para crear una orden con productos
 */
export function useCreateOrderWithProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      orderData, 
      products 
    }: { 
      orderData: CreateOrderData; 
      products: Array<{
        shop_name: string;
        description: string;
        amount_requested: number;
        shop_cost: number;
        total_cost: number;
      }> 
    }) => createOrderWithProducts(orderData, products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
