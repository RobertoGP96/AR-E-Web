/**
 * Tipos para el modelo BuyingAccounts
 */

import type { ID, DateTime } from './base';
import type { Shop } from './shop';

// Modelo principal
export interface BuyingAccount {
  id: ID;
  account_name: string;
  shop?: Shop;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar buying account
export interface CreateBuyingAccountData {
  account_name: string;
  shop_id?: ID;
}

export interface UpdateBuyingAccountData extends Partial<CreateBuyingAccountData> {
  id: ID;
}

// Filtros para buying accounts
export interface BuyingAccountFilters {
  account_name?: string;
  shop_id?: ID;
}