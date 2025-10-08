/**
 * Tipos para el modelo ProductReceived
 */

import type { ID, Date, DateTime } from './base';
import type { DeliverReceip } from './delivery';

// Modelo principal
export interface ProductReceived {
  id: ID;
  original_product: ID;
  order: ID;
  reception_date_in_eeuu: Date;
  reception_date_in_cuba?: Date;
  package_where_was_send: ID;
  deliver_receip?: DeliverReceip;
  amount_received: number;
  amount_delivered: number;
  observation?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar product received
export interface CreateProductReceivedData {
  original_product_id: ID;
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

// Filtros para product received
export interface ProductReceivedFilters {
  original_product_id?: ID;
  order_id?: ID;
  package_where_was_send_id?: ID;
  deliver_receip_id?: ID;
  reception_date_from?: string;
  reception_date_to?: string;
}
