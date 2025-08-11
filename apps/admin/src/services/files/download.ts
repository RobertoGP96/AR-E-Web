/**
 * Servicio para descargar archivos
 */

import { apiClient } from '../../lib/api-client';

/**
 * Descarga un archivo por URL
 */
export const downloadFile = async (
  fileUrl: string,
  filename?: string
): Promise<void> => {
  return await apiClient.downloadFile(fileUrl, filename);
};

/**
 * Descarga archivo de evidencia
 */
export const downloadEvidenceFile = async (
  fileId: number,
  filename?: string
): Promise<void> => {
  return await downloadFile(`/files/evidence/${fileId}/download/`, filename);
};

/**
 * Descarga imagen de producto
 */
export const downloadProductImage = async (
  fileId: number,
  filename?: string
): Promise<void> => {
  return await downloadFile(`/files/products/${fileId}/download/`, filename);
};
