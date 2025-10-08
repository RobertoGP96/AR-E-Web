/**
 * Tipos para el modelo EvidenceImages
 */

import type { ID, DateTime } from './base';

// Modelo principal
export interface EvidenceImage {
  id: ID;
  public_id?: string;
  image_url: string;
  description?: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear imagen de evidencia
export interface CreateEvidenceImageData {
  public_id?: string;
  image_url: string;
  description?: string;
}
