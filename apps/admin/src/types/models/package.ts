/**
 * Tipos para el modelo Package
 */

import type { ID, PackageStatus } from './base';
import type { EvidenceImage } from './evidence';

// Modelo principal
export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  package_picture: EvidenceImage[];
}

// Tipos para crear/editar paquete
export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing?: PackageStatus;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  id: ID;
}
