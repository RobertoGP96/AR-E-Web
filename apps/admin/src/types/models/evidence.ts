/**
 * Tipos para el modelo EvidenceImages
 */

import type { ID } from './base';

// Modelo principal
export interface EvidenceImage {
  id: ID;
  public_id?: string;
  image_url: string;
}

// Tipos para crear imagen de evidencia
export interface CreateEvidenceImageData {
  public_id?: string;
  image_url: string;
}
