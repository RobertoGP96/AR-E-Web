/**
 * Tipos para el modelo ProductReceived
 */

import type { ID, UUID, Date, DateTime } from './base';
import type { Product } from './product';
import type { Order } from './order';
import type { Package } from './package';
import type { DeliverReceip } from './delivery';

// Modelo principal
export interface ProductReceived {
  id: ID;
  original_product: Product;
  order: Order;
  reception_date_in_eeuu: Date;
  reception_date_in_cuba?: Date;
  package_where_was_send: Package;
  deliver_receip?: DeliverReceip;
  amount_received: number;
  amount_delivered: number;
  observation?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar producto recibido
export interface CreateProductReceivedData {
  original_product_id: UUID; // UUID porque Product usa UUID
  order_id: ID;
  reception_date_in_eeuu: Date;
  reception_date_in_cuba?: Date;
  package_where_was_send_id: ID;
  deliver_receip_id?: ID;
  amount_received: number;
  amount_delivered?: number;
  observation?: string;
}

export interface UpdateProductReceivedData extends Partial<CreateProductReceivedData> {
  id: ID;
}
