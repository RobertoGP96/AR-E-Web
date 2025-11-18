/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus } from './base';
import type { CustomUser } from './user';
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
  deliver_picture: string;
  
  // Costos (del backend)
  weight_cost: number;
  manager_profit: number;
  
  // Propiedades computadas

  delivered_products?: ProductDelivery[];
  
  // Nuevos campos calculados del sistema
  delivery_expenses: number;        // Gastos: peso × costo por libra
  system_delivery_profit: number;   // Ganancia sistema: cobro - ganancia agente - gastos
  
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
