/**
 * Tipos para el modelo ProductReceived
 */

import type { ID, UUID, DateTime } from './base';
import type { Product } from './product';
import type { Package } from './package';

// Modelo principal
export interface ProductReceived {
  id: ID;
  original_product: Product;
  package?: Package; // Nullable, se asigna al crear
  amount_received: number;
  observation?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar producto recibido
export interface CreateProductReceivedData {
  original_product_id: UUID; // UUID porque Product usa UUID
  amount_received: number;
  observation?: string;
}

export interface UpdateProductReceivedData extends Partial<CreateProductReceivedData> {
  id: ID;
}
