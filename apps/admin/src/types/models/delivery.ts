/**
 * Tipos para el modelo DeliverReceip
 */

import type { ID, DateTime, DeliveryStatus, PayStatus } from './base';
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
  // Las imágenes de entrega son un array de URLs (strings)
  deliver_picture?: string;
  
  // Costos (del backend)
  weight_cost: number;
  manager_profit: number;
  
  // Campos de pago
  payment_status: PayStatus; // Estado de pago: "No pagado", "Pagado", "Parcial"
  payment_date?: DateTime; // Fecha en que se realizó el pago
  payment_amount: number; // Monto recibido del pago
  
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
  deliver_picture?: string; // URLs de las imágenes de evidencia (opcional)
  payment_status?: PayStatus; // Estado de pago: "No pagado", "Pagado", "Parcial"
  payment_date?: DateTime; // Fecha en que se realizó el pago
  payment_amount?: number; // Monto recibido del pago
}

export interface UpdateDeliverReceipData extends Partial<CreateDeliverReceipData> {
  id: ID;
}

// Analysis response for deliveries
export interface DeliveryAnalysisMonthly {
  month: string | null;
  total: number; // total monetary for month
  total_weight: number; // weight for month
}

export interface DeliveryAnalysisResponse {
  total_delivery_revenue: number;
  total_delivery_expenses: number;
  total_manager_profit: number;
  total_system_profit: number;
  total_weight: number;
  average_weight: number;
  average_delivery_cost: number;
  count: number;
  deliveries_by_status: Record<string, number>;
  // Breakdown by category: key = category name
  deliveries_by_category: Record<string, {
    count: number;
    total_weight: number;
    total_delivery_revenue: number;
    total_delivery_expenses: number;
    total_manager_profit: number;
    total_system_profit: number;
  }>;
  monthly_trend: DeliveryAnalysisMonthly[];
}
