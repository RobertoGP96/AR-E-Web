/**
 * Tipos para el modelo Shop
 */

import type { ID } from './base';
import type { BuyingAccount } from './buying-account';

// Modelo principal
export interface Shop {
  id: ID;
  name: string;
  link: string;
  description?: string;
  location?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  buying_accounts?: BuyingAccount[]; // Lista de cuentas de compra asociadas
}

// Tipos para crear/editar tienda
export interface CreateShopData {
  name: string;
  link: string;
  description?: string;
  location?: string;
}

export interface UpdateShopData extends Partial<CreateShopData> {
  id: ID;
}
