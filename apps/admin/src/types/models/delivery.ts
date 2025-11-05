/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus } from './base';
import type { CustomUser } from './user';
import type { EvidenceImage } from './evidence';
import type { ProductDelivery } from './product-delivery';
import type { Category } from './category';

// Modelo principal
export interface DeliverReceip {
  id: ID;
  client: CustomUser; // Cliente REQUERIDO (ya no es opcional)
  category?: Category; // Categoría de productos en el delivery (opcional)
  weight: number;
  status: DeliveryStatus;
  deliver_date: DateTime;
  deliver_picture: EvidenceImage[];
  
  // Costos (del backend)
  weight_cost: number;
  manager_profit: number;
  
  // Propiedades computadas
  total_cost_of_deliver: number;
  calculated_shipping_cost?: number; // Costo calculado basado en categoría
  delivered_products?: ProductDelivery[];
  
  // Timestamps
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar recibo de entrega
export interface CreateDeliverReceipData {
  client_id: ID; // ID del cliente REQUERIDO
  category_id?: ID; // ID de la categoría (opcional)
  weight: number;
  status?: DeliveryStatus;
  deliver_date?: DateTime;
  weight_cost?: number;
  manager_profit?: number;
  deliver_picture?: string[]; // URLs de las imágenes de evidencia (opcional)
}

export interface UpdateDeliverReceipData extends Partial<CreateDeliverReceipData> {
  id: ID;
}
