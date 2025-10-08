/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus } from './base';
import type { EvidenceImage } from './evidence';
import type { ProductReceived } from './product-received';

// Type alias para OrderID
type OrderID = ID;

// Modelo principal
export interface DeliverReceip {
  id: ID;
  order: OrderID;
  weight: number;
  status: DeliveryStatus; // Estado específico para entregas
  deliver_date: DateTime;
  deliver_picture: EvidenceImage[];
  weight_cost: number;
  manager_profit: number;
  created_at: DateTime;
  updated_at: DateTime;
  
  // Productos entregados en este delivery receipt
  products_delivered: ProductReceived[];
  
  // Método computado
  total_cost_of_deliver: number;
}

// Tipos para crear/editar deliver receip
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

// Filtros para deliver receips
export interface DeliverReceipFilters {
  order_id?: ID;
  status?: DeliveryStatus;
  deliver_date_from?: string;
  deliver_date_to?: string;
}
