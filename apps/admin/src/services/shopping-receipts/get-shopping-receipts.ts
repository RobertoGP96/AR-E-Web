/**
 * Servicio para obtener recibos de compra
 */

import { apiClient } from '../../lib/api-client';
import type { ShoppingReceipFilters, PaginatedApiResponse } from '../../types/api';
import type { ShoppingReceip } from '../../types';

/**
 * Obtiene lista paginada de recibos de compra
 */
export const getShoppingReceipts = async (
  filters?: ShoppingReceipFilters
): Promise<PaginatedApiResponse<ShoppingReceip>> => {
  return await apiClient.getPaginated<ShoppingReceip>('/api_data/shopping_reciep/', filters);
};

/**
 * Obtiene un recibo de compra por ID
 */
export const getShoppingReceiptById = async (id: number) => {
  return await apiClient.get<ShoppingReceip>(`/api_data/shopping_reciep/${id}/`);
};

/**
 * Obtiene recibos de compra por estado
 */
export const getShoppingReceiptsByStatus = async (status: string, filters?: ShoppingReceipFilters) => {
  const statusFilters = { ...filters, status_of_shopping: status };
  return await apiClient.getPaginated<ShoppingReceip>('/api_data/shopping_reciep/', statusFilters);
};

/**
 * Obtiene recibos de compra por tienda
 */
export const getShoppingReceiptsByShop = async (shopId: number, filters?: ShoppingReceipFilters) => {
  const shopFilters = { ...filters, shop_of_buy_id: shopId };
  return await apiClient.getPaginated<ShoppingReceip>('/api_data/shopping_reciep/', shopFilters);
};

/**
 * Obtiene recibos de compra por cuenta de compra
 */
export const getShoppingReceiptsByAccount = async (accountId: number, filters?: ShoppingReceipFilters) => {
  const accountFilters = { ...filters, shopping_account_id: accountId };
  return await apiClient.getPaginated<ShoppingReceip>('/api_data/shopping_reciep/', accountFilters);
};

/**
 * Búsqueda de recibos de compra por término
 */
export const searchShoppingReceipts = async (searchTerm: string, filters?: ShoppingReceipFilters) => {
  const searchFilters = { ...filters, search: searchTerm };
  return await apiClient.getPaginated<ShoppingReceip>('/api_data/shopping_reciep/', searchFilters);
};