/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus } from './base';
import type { Order } from './order';
import type { EvidenceImage } from './evidence';
import type { ProductDelivery } from './product-delivery';

// Modelo principal
export interface DeliverReceip {
  id: ID;
  order: Order;
  weight: number;
  status: DeliveryStatus;
  deliver_date: DateTime;
  deliver_picture: EvidenceImage[];
  
  // Costos (del backend)
  weight_cost: number;
  manager_profit: number;
  
  // Propiedades computadas
  total_cost_of_deliver: number;
  delivered_products?: ProductDelivery[]; // Cambiado a ProductDelivery
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar recibo de entrega
export interface CreateDeliverReceipData {
  order_id: ID;
  weight: number;
  status?: DeliveryStatus;
  deliver_date?: DateTime;
  weight_cost?: number;
  manager_profit?: number;
}

export interface UpdateDeliverReceipData extends Partial<CreateDeliverReceipData> {
  id: ID;
}
