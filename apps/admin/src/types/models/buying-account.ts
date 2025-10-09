/**
 * Tipos para el modelo BuyingAccounts
 */

import type { ID, DateTime } from './base';
import type { Shop } from './shop';

// Modelo principal
export interface BuyingAccount {
  id: ID;
  account_name: string;
  shop?: Shop; // Relación con Shop (del backend)
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar cuenta de compra
export interface CreateBuyingAccountData {
  account_name: string;
  shop_id?: ID;
}

export interface UpdateBuyingAccountData extends Partial<CreateBuyingAccountData> {
  id: ID;
}
