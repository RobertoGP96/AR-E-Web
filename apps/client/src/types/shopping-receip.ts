/**
 * Tipos para el modelo ShoppingReceip
 */

import type { ID, DateTime, ShoppingStatus } from './base';
import type { BuyingAccount } from './buying-account';
import type { ProductBuyed } from './product-buyed';

// Modelo principal
export interface ShoppingReceip {
  id: ID;
  shopping_account: BuyingAccount;
  shop_of_buy: ID;
  status_of_shopping: ShoppingStatus;
  buy_date: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
  
  // Productos comprados en este shopping receipt
  products_buyed: ProductBuyed[];
}

// Tipos para crear/editar shopping receip
export interface CreateShoppingReceipData {
  shopping_account_id: ID;
  shop_of_buy_id: ID;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
}

export interface UpdateShoppingReceipData extends Partial<CreateShoppingReceipData> {
  id: ID;
}

// Filtros para shopping receips
export interface ShoppingReceipFilters {
  status_of_shopping?: ShoppingStatus;
  shop_of_buy_id?: ID;
  shopping_account_id?: ID;
  buy_date_from?: string;
  buy_date_to?: string;
}