/**
 * Tipos para el modelo BuyingAccounts
 */

import type { ID } from './base';

// Modelo principal
export interface BuyingAccount {
  id: ID;
  account_name: string;
}

// Tipos para crear/editar cuenta de compra
export interface CreateBuyingAccountData {
  account_name: string;
}

export interface UpdateBuyingAccountData extends Partial<CreateBuyingAccountData> {
  id: ID;
}
