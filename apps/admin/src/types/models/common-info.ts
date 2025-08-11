/**
 * Tipos para el modelo CommonInformation
 */

import type { ID } from './base';

// Modelo principal
export interface CommonInformation {
  id: ID;
  change_rate: number;
  cost_per_pound: number;
}

// Tipos para actualizar información común
export interface UpdateCommonInformationData {
  change_rate?: number;
  cost_per_pound?: number;
}
