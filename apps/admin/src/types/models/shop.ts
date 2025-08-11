/**
 * Tipos para el modelo Shop
 */

import type { ID } from './base';

// Modelo principal
export interface Shop {
  id: ID;
  name: string;
  link: string;
}

// Tipos para crear/editar tienda
export interface CreateShopData {
  name: string;
  link: string;
}

export interface UpdateShopData extends Partial<CreateShopData> {
  id: ID;
}
