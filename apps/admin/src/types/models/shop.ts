/**
 * Tipos para el modelo Shop
 */

import type { ID, DateTime } from './base';
import type { BuyingAccountNested } from './buying-account';

// Modelo principal
export interface Shop {
  id: ID;
  name: string;
  link: string;
  is_active: boolean;
  created_at: DateTime;
  updated_at: DateTime;
  buying_accounts?: BuyingAccountNested[]; // Lista de cuentas de compra asociadas
}

// Tipos para crear/editar tienda
export interface CreateShopData {
  name: string;
  link: string;
  is_active?: boolean;
}

export interface UpdateShopData extends Partial<CreateShopData> {
  id: ID;
}
