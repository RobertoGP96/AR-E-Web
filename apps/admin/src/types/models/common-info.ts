/**
 * Tipos para el modelo CommonInformation
 */

import type { ID, DateTime } from './base';

// Modelo principal
export interface CommonInformation {
  id: ID;
  change_rate: number;
  cost_per_pound: number;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para actualizar información común
export interface UpdateCommonInformationData {
  change_rate?: number;
  cost_per_pound?: number;
}
