/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus } from './base';
import type { Order } from './order';
import type { EvidenceImage } from './evidence';

// Modelo principal
export interface DeliverReceip {
  id: ID;
  order: Order;
  weight: number;
  status: DeliveryStatus;
  deliver_date: DateTime;
  deliver_picture: EvidenceImage[];
  
  // Propiedades computadas
  total_cost_of_deliver: number;
}

// Tipos para crear/editar recibo de entrega
export interface CreateDeliverReceipData {
  order_id: ID;
  weight: number;
  status?: DeliveryStatus;
  deliver_date?: DateTime;
}

export interface UpdateDeliverReceipData extends Partial<CreateDeliverReceipData> {
  id: ID;
}
