/**
 * Tipos para el modelo BuyingAccounts
 */

import type { ID, DateTime } from './base';

// Modelo anidado (cuando viene dentro de Shop)
export interface BuyingAccountNested {
  id: ID;
  account_name: string;
  created_at?: DateTime;
  updated_at?: DateTime;
}

// Modelo principal (cuando se obtiene directamente)
export interface BuyingAccount extends BuyingAccountNested {
  shop?: string; // Nombre de la tienda (slug field del backend)
}

// Tipos para crear/editar cuenta de compra
export interface CreateBuyingAccountData {
  account_name: string;
  shop?: string; // Nombre de la tienda (el backend usa slug_field)
}

export interface UpdateBuyingAccountData extends Partial<CreateBuyingAccountData> {
  id: ID;
}
