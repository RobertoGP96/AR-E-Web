/**
 * Tipos para el modelo ProductBuyed
 */

import type { ID, DateTime } from './base';
import type { ShoppingReceip } from './shopping-receip';

// Modelo principal
export interface ProductBuyed {
  id: ID;
  original_product: ID;
  order: ID;
  actual_cost_of_product: number;
  shop_discount: number;
  offer_discount: number;
  buy_date: DateTime;
  shoping_receip: ShoppingReceip;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product: number;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar product buyed
export interface CreateProductBuyedData {
  original_product_id: ID;
  order_id: ID;
  actual_cost_of_product: number;
  shop_discount?: number;
  offer_discount?: number;
  buy_date?: DateTime;
  shoping_receip_id: ID;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product: number;
}

export interface UpdateProductBuyedData extends Partial<CreateProductBuyedData> {
  id: ID;
}

// Filtros para product buyed
export interface ProductBuyedFilters {
  original_product_id?: ID;
  order_id?: ID;
  shoping_receip_id?: ID;
  buy_date_from?: string;
  buy_date_to?: string;
}