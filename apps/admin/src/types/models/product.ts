/**
 * Tipos para el modelo Product
 */

import type { ID, UUID, ProductStatus, DateTime } from './base';
import type { Order } from './order';
import type { EvidenceImage } from './evidence';

// Modelo principal
export interface Product {
  id: UUID;
  sku: string;
  name: string;
  link?: string;
  shop: string;
  description?: string;
  observation?: string;
  category?: string;
  image_url?: string;
  
  // Cantidades (alineado con backend)
  amount_requested: number;
  amount_purchased: number;
  amount_delivered: number;
  amount_received: number;
  
  order: number | Order;
  status: ProductStatus;
  product_pictures: EvidenceImage[];
  
  // Precios
  shop_cost: number;
  shop_delivery_cost: number;
  shop_taxes: number;
  own_taxes: number;
  added_taxes: number;
  total_cost: number;
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
  
  // Propiedades computadas (del backend)
  cost_per_product: number;
  amount_buyed: number;
  pending_purchase: number;
  pending_delivery: number;
  is_fully_purchased: boolean;
  is_fully_delivered: boolean;
}

// Tipos para crear/editar producto
export interface CreateProductData {
  name: string;
  link?: string;
  image_url?: string;
  sku?: string;
  shop_id?: string;
  description?: string;
  category?: string;
  amount_requested: number;
  order_id?: ID;
  
  status?: ProductStatus;
  //PRICE
  
  shop_cost: number;
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
  shop_id?: string;
  order_id?: ID;
  category?: string;
  name?: string;
}
