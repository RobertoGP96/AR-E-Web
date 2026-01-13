/**
 * Tipos para el modelo ProductBuyed
 */

import type { ID, DateTime } from './base';
import type { Product } from './product';

import type { ShoppingReceip } from './shopping-receip';

// Modelo principal
export interface ProductBuyed {
  id?: ID;
  product_id: string;
  shop_discount?: number;
  offer_discount?: number;
  buy_date?: DateTime;
  shopping_receip: ShoppingReceip;
  amount_buyed: number;
  quantity_refunded: number;
  observation?: string;
  real_cost_of_product?: number;
  is_refunded: boolean;
  refund_date?: DateTime | null;
  refund_amount: number;
  refund_notes?: string | null;
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


export type RefunedInfo = {
  is_refuned: boolean;
  refund_date: DateTime | null;
  refund_amount: number;
  refund_notes: string | null;
  quantity_refunded: number;
}