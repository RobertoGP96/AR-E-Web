/**
 * Tipos para el modelo ProductReceived
 */

import type { ID, Date } from './base';
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
}
