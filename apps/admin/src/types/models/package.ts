/**
 * Tipos para el modelo Package
 */

import type { ID, PackageStatus } from './base';
import type { EvidenceImage } from './evidence';
import type { ProductReceived } from './product-received';

// Modelo principal
export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  package_picture: EvidenceImage[];
  contained_products?: ProductReceived[]; // Productos contenidos en el paquete
  created_at: string;
  updated_at: string;
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
