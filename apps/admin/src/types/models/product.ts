/**
 * Tipos para el modelo Product
 */

import type { ID, UUID, ProductStatus, DateTime } from './base';
import type { Order } from './order';
import type { ProductBuyed } from './product-buyed';
import type { ProductReceived } from './product-received';
import type { ProductDelivery } from './product-delivery';

// Tipo util para los payloads de imagen: puede ser simplemente una URL o un objeto con image_url/picture
export type ProductPicture = string | { image_url?: string; picture?: string };

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
  client_name?: string;
  
  // Cantidades (alineado con backend)
  amount_requested: number;
  amount_purchased: number;
  amount_delivered: number;
  amount_received: number;
  
  order: number | Order;
  status: ProductStatus;
  // Almacenado en la base de datos como un único string (JSON), y la API ahora debe tratarlo como tal
  product_pictures?: string;
  
  // Precios
  shop_cost: number;
  shop_taxes: number;
  shop_delivery_cost: number;
  charge_iva: boolean;
  base_tax: number; // IVA 7% calculado sobre (precio + envío)
  shop_tax_amount: number; // Impuesto adicional calculado (3% o 5%)
  own_taxes: number;
  added_taxes: number;
  total_cost: number;
  
  // Cálculos del sistema (nuevos campos)
  system_expenses: number;  // Gastos: precio + envío + 7% + impuesto add
  system_profit: number;     // Ganancias: total_cost - system_expenses
  
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
  
  // Relaciones para timeline
  buys?: ProductBuyed[];
  receiveds?: ProductReceived[];
  delivers?: ProductDelivery[];
}

// Tipos para crear/editar producto
export interface CreateProductData {
  name: string;
  link?: string;
  image_url?: string;
  sku?: string;
  shop?: string; // Nombre de la tienda (slug_field="name") o pk (id) para creación/edición
  description?: string;
  category?: string; // Nombre de la categoría o pk (id) para creación/edición
  amount_requested: number;
  order: ID; // ID del pedido (slug_field="id")
  
  status?: ProductStatus;
  //PRICE
  
  shop_cost?: number;
  shop_delivery_cost?: number;
  shop_taxes?: number;
  charge_iva?: boolean;
  base_tax?: number; // IVA 7% calculado sobre (precio + envío)
  shop_tax_amount?: number; // Impuesto adicional calculado (3% o 5%)
  own_taxes?: number;
  added_taxes?: number;
  total_cost?: number;
  // Para creación se acepta únicamente un string (JSON serializado, o una URL simple)
  product_pictures?: string;
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
