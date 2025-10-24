/**
 * Tipos para el modelo ProductBuyed
 */

import type { ID, DateTime } from './base';
import type { Product } from './product';

import type { ShoppingReceip } from './shopping-receip';

// Modelo principal
export interface ProductBuyed {
  id: ID;
  product_id: string;
  actual_cost_of_product?: number;
  shop_discount?: number;
  offer_discount?: number;
  buy_date?: DateTime;
  shopping_receip: ShoppingReceip;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product?: number;
  created_at: DateTime;
  updated_at: DateTime;
  original_product_details: Product;
}

// Tipos para crear/editar producto comprado
export interface CreateProductBuyedData {
  original_product: string; // Product ID
  amount_buyed: number; 
}

export interface UpdateProductBuyedData extends Partial<CreateProductBuyedData> {
  id: ID;
}
