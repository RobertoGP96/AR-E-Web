/**
 * Tipos para el modelo Package
 */

import type { ID, DateTime, PackageStatus } from './base';

// Modelo principal
export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  arrival_date: string;
  /** Foto 1 del paquete (URL o ""). */
  package_picture: string;
  /** Foto 2 del paquete (URL o ""). */
  package_picture_2: string;
  created_at: DateTime;
  updated_at: DateTime;
}

// Tipos para crear/editar package
export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  arrival_date: string;
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