/**
 * Tipos para el modelo ProductDelivery
 */

import type { ID, UUID, Date, DateTime } from './base';
import type { Product } from './product';
import type { DeliverReceip } from './delivery';

// Modelo principal
export interface ProductDelivery {
  id: ID;
  original_product: Product;
  reception?: Date; // Fecha de recepción, nullable
  deliver_receip?: DeliverReceip; // Nullable
  amount_delivered: number;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar producto entregado
export interface CreateProductDeliveryData {
  original_product_id: UUID; // UUID porque Product usa UUID
  reception?: Date;
  deliver_receip_id?: ID;
  amount_delivered: number;
}

export interface UpdateProductDeliveryData extends Partial<CreateProductDeliveryData> {
  id: ID;
}