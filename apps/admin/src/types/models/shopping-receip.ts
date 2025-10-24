/**
 * Tipos para el modelo ShoppingReceip
 */

import type { ID, DateTime, ShoppingStatus } from './base';
import type { ProductBuyed, CreateProductBuyedData } from './product-buyed';


// Modelo principal
export interface ShoppingReceip {
  id: ID;
  shopping_account: string;
  shop_of_buy: string;
  status_of_shopping: string;
  buy_date: DateTime;
  
  // Propiedades computadas
  total_cost_of_shopping: number;
  buyed_products?: ProductBuyed[];
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar recibo de compra
export interface CreateShoppingReceipData {
  shopping_account_id: ID;
  shop_of_buy_id: ID;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
  buyed_products?: CreateProductBuyedData[];
  total_cost_of_shopping: number;
}

export interface UpdateShoppingReceipData extends Partial<CreateShoppingReceipData> {
  id: ID;
}
