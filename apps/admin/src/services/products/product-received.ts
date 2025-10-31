/**
 * Servicio para ProductReceived
 */

import { apiClient } from '../../lib/api-client';
import type { PaginatedApiResponse, ProductReceivedFilters } from '../../types/api';
import type { ProductReceived, CreateProductReceivedData, UpdateProductReceivedData, Product } from '../../types';

/**
 * Obtiene lista paginada de productos recibidos
 */
export const getProductReceiveds = async (
  filters?: ProductReceivedFilters
): Promise<PaginatedApiResponse<ProductReceived>> => {
  return await apiClient.getPaginated<ProductReceived>('/api_data/product_received/', filters);
};

/**
 * Obtiene un producto recibido por ID
 */
export const getProductReceivedById = async (id: number) => {
  return await apiClient.get<ProductReceived>(`/api_data/product_received/${id}/`);
};

/**
 * Crea un nuevo producto recibido
 */
export const createProductReceived = async (data: CreateProductReceivedData) => {
  return await apiClient.post<ProductReceived>('/api_data/product_received/', data);
};

/**
 * Actualiza un producto recibido
 */
export const updateProductReceived = async (id: number, data: UpdateProductReceivedData) => {
  return await apiClient.patch<ProductReceived>(`/api_data/product_received/${id}/`, data);
};

/**
 * Elimina un producto recibido
 */
export const deleteProductReceived = async (id: number) => {
  return await apiClient.delete(`/api_data/product_received/${id}/`);
};

/**
 * Obtiene productos disponibles para recepción (no completamente recibidos)
 */
export const getAvailableProductsForReception = async (orderId: number): Promise<Product[]> => {
  // Obtener productos de la orden que no están completamente recibidos
  const products = await apiClient.getPaginated<Product>('/api_data/product/', {
    order_id: orderId,
    // Filtrar productos donde amount_received < amount_requested
    // Esto podría necesitar un filtro personalizado en el backend
  });

  // Filtrar en frontend por ahora
  return products.results.filter((product: Product) =>
    product.amount_received < product.amount_requested
  );
};