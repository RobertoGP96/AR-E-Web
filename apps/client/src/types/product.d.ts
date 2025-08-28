/**
 * Tipos para el modelo Product
 */

import type { ID, UUID, ProductStatus } from './base';
import type { Shop } from './shop';
import type { Order } from './order';
import type { EvidenceImage } from './evidence';

// Modelo principal
export interface Product {
  id: UUID;
  sku: string;
  name: string;
  link?: string;
  shop: Shop;
  description?: string;
  observation?: string;
  category?: string;
  amount_requested: number;
  order: Order;
  status: ProductStatus;
  product_pictures: EvidenceImage[];
  
  // Precios
  shop_cost: number;
  shop_delivery_cost: number;
  shop_taxes: number;
  own_taxes: number;
  added_taxes: number;
  total_cost: number;
}

// Tipos para crear/editar producto
export interface CreateProductData {
  sku: string;
  name: string;
  link?: string;
  shop_id?: ID;
  description?: string;
  observation?: string;
  category?: string;
  amount_requested?: number;
  order_id: ID;
  status?: ProductStatus;
  shop_cost?: number;
  shop_delivery_cost?: number;
  shop_taxes?: number;
  own_taxes?: number;
  added_taxes?: number;
  total_cost?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: UUID;
}

// Filtros para productos
export interface ProductFilters {
  status?: ProductStatus;
  shop_id?: ID;
  order_id?: ID;
  category?: string;
  name?: string;
}


export type CreateProduc = {
  name: string;
  link: string;
  shop: string;
  description: string;
}