/**
 * Tipos para el modelo Package
 */

import type { ID, PackageStatus } from './base';
import type { ProductReceived } from './product-received';

// Modelo principal
export type PackageImage = string | { id?: number; picture?: string };

export interface Package {
  id: ID;
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  arrival_date: string;
  /**
   * Foto 1. El backend la devuelve como cadena (URL o ""); datos
   * históricos pueden traer un array de URLs u objetos `{ picture }`.
   * Usar `getPackagePictures()` (lib/package-pictures) para leerla.
   */
  package_picture?: string | PackageImage[] | null;
  /** Foto 2 (URL o ""). */
  package_picture_2?: string | null;
  contained_products?: ProductReceived[]; // Productos contenidos en el paquete
  created_at: string;
  updated_at: string;
}

// Tipos para crear/editar paquete
export interface CreatePackageData {
  agency_name: string;
  number_of_tracking: string;
  status_of_processing: PackageStatus;
  arrival_date: string;
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  id: ID;
}
