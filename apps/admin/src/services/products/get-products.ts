/**
 * Servicio para obtener productos
 */

import { apiClient } from '../../lib/api-client';
import type { ProductFilters, PaginatedApiResponse } from '../../types/api';
import type { Product } from '../../types';

/**
 * Obtiene lista paginada de productos
 */
export const getProducts = async (
  filters?: ProductFilters
): Promise<PaginatedApiResponse<Product>> => {
  return await apiClient.getPaginated<Product>('/products/', filters);
};

/**
 * Obtiene un producto por ID
 */
export const getProductById = async (id: number) => {
  return await apiClient.get<Product>(`/products/${id}/`);
};

/**
 * Obtiene productos por estado
 */
export const getProductsByStatus = async (status: string, filters?: ProductFilters) => {
  const statusFilters = { ...filters, status };
  return await apiClient.getPaginated<Product>('/products/', statusFilters);
};

/**
 * Obtiene productos de una tienda específica
 */
export const getProductsByShop = async (shopId: number, filters?: ProductFilters) => {
  const shopFilters = { ...filters, shop_id: shopId };
  return await apiClient.getPaginated<Product>('/products/', shopFilters);
};

/**
 * Obtiene productos de una orden específica
 */
export const getProductsByOrder = async (orderId: number, filters?: ProductFilters) => {
  const orderFilters = { ...filters, order_id: orderId };
  return await apiClient.getPaginated<Product>('/products/', orderFilters);
};

/**
 * Búsqueda de productos por término
 */
export const searchProducts = async (searchTerm: string, filters?: ProductFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<Product>('/products/', searchFilters);
};
