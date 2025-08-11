/**
 * Tipos para el modelo ProductBuyed
 */

import type { ID, DateTime } from './base';
import type { Product } from './product';
import type { Order } from './order';
import type { ShoppingReceip } from './shopping-receip';

// Modelo principal
export interface ProductBuyed {
  id: ID;
  original_product: Product;
  order: Order;
  actual_cost_of_product: number;
  shop_discount: number;
  offer_discount: number;
  buy_date: DateTime;
  shoping_receip: ShoppingReceip;
  amount_buyed: number;
  observation?: string;
  real_cost_of_product: number;
}

// Tipos para crear/editar producto comprado
export interface CreateProductBuyedData {
  original_product_id: string; // UUID
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
