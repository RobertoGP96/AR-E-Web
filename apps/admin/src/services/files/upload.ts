/**
 * Servicio para subir archivos
 */

import { apiClient } from '../../lib/api-client';
import type { UploadedFile, ApiResponse } from '../../types';

/**
 * Sube un archivo al servidor
 */
export const uploadFile = async (
  file: File,
  options?: {
    onUploadProgress?: (progressEvent: unknown) => void;
    folder?: string;
  }
): Promise<ApiResponse<UploadedFile>> => {
  const url = options?.folder ? `/files/upload/${options.folder}/` : '/files/upload/';
  
  const response = await apiClient.uploadFile(url, file, {
    onUploadProgress: options?.onUploadProgress
  });
  
  return response as ApiResponse<UploadedFile>;
};

/**
 * Sube múltiples archivos
 */
export const uploadMultipleFiles = async (
  files: File[],
  options?: {
    onUploadProgress?: (progressEvent: unknown) => void;
    folder?: string;
  }
): Promise<ApiResponse<UploadedFile[]>> => {
  const uploadedFiles: UploadedFile[] = [];
  
  for (const file of files) {
    const response = await uploadFile(file, options);
    if (response.success && response.data) {
      uploadedFiles.push(response.data);
    }
  }
  
  return {
    success: true,
    data: uploadedFiles
  };
};

/**
 * Sube imagen de producto
 */
export const uploadProductImage = async (
  file: File,
  onUploadProgress?: (progressEvent: unknown) => void
): Promise<ApiResponse<UploadedFile>> => {
  return await uploadFile(file, {
    folder: 'products',
    onUploadProgress
  });
};

/**
 * Sube imagen de evidencia
 */
export const uploadEvidenceImage = async (
  file: File,
  onUploadProgress?: (progressEvent: unknown) => void
): Promise<ApiResponse<UploadedFile>> => {
  return await uploadFile(file, {
    folder: 'evidence',
    onUploadProgress
  });
};
