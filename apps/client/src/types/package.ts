/**
 * Tipos para el modelo Package
 */

import type { ID, DateTime, PackageStatus } from './base';
import type { EvidenceImage } from './evidence';

// Modelo principal
export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  package_picture: EvidenceImage[];
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar package
export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing?: PackageStatus;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  id: ID;
}

// Filtros para packages
export interface PackageFilters {
  status_of_processing?: PackageStatus;
  agency_name?: string;
  number_of_tracking?: string;
}