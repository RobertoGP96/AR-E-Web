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

// Tipos para crear/editar common information
export interface CreateCommonInformationData {
  change_rate: number;
  cost_per_pound: number;
}

export interface UpdateCommonInformationData extends Partial<CreateCommonInformationData> {
  id: ID;
}