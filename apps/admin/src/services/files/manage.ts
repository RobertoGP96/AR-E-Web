/**
 * Servicio para gestionar archivos
 */

import { apiClient } from '../../lib/api-client';
import type { UploadedFile, ApiResponse, PaginatedApiResponse } from '../../types';

/**
 * Obtiene lista de archivos subidos
 */
export const getFiles = async (filters?: {
  folder?: string;
  search?: string;
}): Promise<PaginatedApiResponse<UploadedFile>> => {
  return await apiClient.getPaginated<UploadedFile>('/files/', filters);
};

/**
 * Obtiene información de un archivo
 */
export const getFileById = async (id: number): Promise<ApiResponse<UploadedFile>> => {
  return await apiClient.get<UploadedFile>(`/files/${id}/`);
};

/**
 * Elimina un archivo
 */
export const deleteFile = async (id: number): Promise<ApiResponse<void>> => {
  return await apiClient.delete<void>(`/files/${id}/`);
};

/**
 * Elimina múltiples archivos
 */
export const deleteMultipleFiles = async (ids: number[]): Promise<ApiResponse<void>> => {
  return await apiClient.post<void>('/files/bulk-delete/', { file_ids: ids });
};
