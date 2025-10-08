/**
 * Tipos para el modelo Shop
 */

import type { ID, DateTime } from './base';

// Modelo principal
export interface Shop {
  id: ID;
  name: string;
  link: string;
  is_active: boolean;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar shop
export interface CreateShopData {
  name: string;
  link: string;
  is_active?: boolean;
}

export interface UpdateShopData extends Partial<CreateShopData> {
  id: ID;
}

// Filtros para shops
export interface ShopFilters {
  is_active?: boolean;
  name?: string;
}