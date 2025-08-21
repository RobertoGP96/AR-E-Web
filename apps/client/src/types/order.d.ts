/**
 * Tipos para el modelo Order
 */

import type { ID, OrderStatus, PayStatus } from './base';
import type { CustomUser } from './user';
import type { DeliverReceip } from './delivery';

// Modelo principal
export interface Order {
  id: ID;
  client: CustomUser;
  sales_manager: CustomUser;
  status: OrderStatus;
  pay_status: PayStatus;
  
  // Propiedades computadas
  total_cost: number;
  received_products: DeliverReceip[];
  received_value_of_client: number;
  extra_payments: number;
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
