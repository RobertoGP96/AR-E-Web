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
