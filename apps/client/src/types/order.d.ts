/**
 * Tipos para el modelo Order
 */
import { PayStatus, ID, OrderStatus  } from "./base"

import type { CustomUser } from './user';
import type { DeliverReceip } from './delivery';
import { Product } from './product';

// Modelo principal
export interface Order {
  //#ID
  id: ID;
  
  client?: CustomUser;
  sales_manager?: CustomUser;
  
  //Status
  status: OrderStatus;
  pay_status: PayStatus;
  
  //Productos y entregas
  delivery: DeliverReceip[];
  products: Product[]
    
  //Money - propiedades computadas
  total_cost: number;
  received_value_of_client?: number;
  extra_payments?: number;

  // Propiedades computadas adicionales del backend
  total_products_requested: number;
  total_products_purchased: number;
  total_products_delivered: number;

  //Date
  created_at?: string;
  updated_at?: string;
}

// Tipos para crear/editar pedido
export interface CreateOrderData {
  client_id: ID;
  sales_manager_id: ID;
  status?: OrderStatus;
  pay_status?: PayStatus;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  id: ID;
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
