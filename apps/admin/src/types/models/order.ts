/**
 * Tipos para el modelo Order
 */

import type { ID, DateTime, OrderStatus, PayStatus } from './base';
import type { CustomUser } from './user';
import type { DeliverReceip } from './delivery';
import type { Product } from './product';

// Modelo principal
export interface Order {
  id: ID;
  client?: CustomUser;
  sales_manager?: CustomUser;
  status: OrderStatus;
  pay_status: PayStatus;
  observations?: string;
  
  // Productos y entregas
  products?: Product[];
  delivery_receipts?: DeliverReceip[];
  
  // Propiedades computadas de dinero
  total_cost: number;
  received_value_of_client: number;
  
  // Propiedades computadas de productos (del backend)
  total_products_requested: number;
  total_products_purchased: number;
  total_products_delivered: number;
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar pedido
export interface CreateOrderData {
  client_id: ID;
  sales_manager_id?: ID;
  status?: OrderStatus;
  pay_status?: PayStatus;
  observations?: string;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  id?: ID;
  client_id?: ID;
  sales_manager_id?: ID;
  status?: OrderStatus;
  pay_status?: PayStatus;
  observations?: string;
}

// Filtros para pedidos
export interface OrderFilters {
  status?: OrderStatus;
  pay_status?: PayStatus;
  client_id?: ID;
  sales_manager_id?: ID;
  date_from?: string;
  date_to?: string;
}

// Estadísticas de pedidos
export interface OrderStats {
  total_cost: number;
  products_count: number;
  status: OrderStatus;
  pay_status: PayStatus;
  created_date: DateTime;
}
