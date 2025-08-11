/**
 * Tipos para el modelo ShoppingReceip
 */

import type { ID, DateTime, ShoppingStatus } from './base';
import type { BuyingAccount } from './buying-account';
import type { Shop } from './shop';

// Modelo principal
export interface ShoppingReceip {
  id: ID;
  shopping_account: BuyingAccount;
  shop_of_buy: Shop;
  status_of_shopping: ShoppingStatus;
  buy_date: DateTime;
  
  // Propiedades computadas
  total_cost_of_shopping: number;
}

// Tipos para crear/editar recibo de compra
export interface CreateShoppingReceipData {
  shopping_account_id: ID;
  shop_of_buy_id: ID;
  status_of_shopping?: ShoppingStatus;
  buy_date?: DateTime;
}

export interface UpdateShoppingReceipData extends Partial<CreateShoppingReceipData> {
  id: ID;
}
