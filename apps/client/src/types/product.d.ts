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
  shop: ShopID;
  description?: string;
  observation?: string;
  category?: string;
  
  // Nuevos campos para control de cantidades
  amount_requested: number;
  amount_purchased: number;
  amount_delivered: number;
  
  order: Order;
  status: ProductStatus;
  // product_pictures is a single URL string that references the main image
  product_pictures?: string;
  
  // Precios
  shop_cost: number;
  shop_delivery_cost: number;
  shop_taxes: number;
  charge_iva: boolean;
  own_taxes: number;
  added_taxes: number;
  total_cost: number;
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
  
  // Propiedades computadas
  pending_purchase: number;
  pending_delivery: number;
  is_fully_purchased: boolean;
  is_fully_delivered: boolean;
}

// Tipos para crear/editar producto
export interface CreateProductData {
  sku: string;
  name: string;
  link?: string;
  shop_id?: string;

  description?: string;
  
  category?: string;
  
  amount_requested?: number;
  amount_purchased?: number;
  amount_delivered?: number;
  
  order_id: ID;
  status?: ProductStatus;
  
  shop_cost?: number;
  shop_delivery_cost?: number;
  shop_taxes?: number;
  charge_iva?: boolean;
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
  tags?: string[];
}