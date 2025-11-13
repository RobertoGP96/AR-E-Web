import { useState, useCallback } from 'react';
import { 
  uploadImageToCloudinary, 
  validateImageFile,
  type EntityType,
  type CloudinaryUploadResult 
} from '@/services/cloudinaryService';

interface UseCloudinaryOptions {
  entityType: EntityType;
  folder?: string;
  maxSizeMB?: number;
  onSuccess?: (result: CloudinaryUploadResult) => void;
  onError?: (error: Error) => void;
}

interface UseCloudinaryReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedImage: CloudinaryUploadResult | null;
  uploadImage: (file: File) => Promise<CloudinaryUploadResult | null>;
  uploadMultipleImages: (files: File[]) => Promise<CloudinaryUploadResult[]>;
  resetState: () => void;
}

/**
 * Hook para manejar uploads a Cloudinary
 * @param options - Configuración del hook
 * @returns Estado y funciones para subir imágenes
 */
export const useCloudinary = ({
  entityType,
  folder,
  maxSizeMB = 10,
  onSuccess,
  onError,
}: UseCloudinaryOptions): UseCloudinaryReturn => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadResult | null>(null);

  /**
   * Sube una sola imagen a Cloudinary
   */
  const uploadImage = useCallback(
    async (file: File): Promise<CloudinaryUploadResult | null> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Validar archivo
        validateImageFile(file, maxSizeMB);

        // Simular progreso (Cloudinary API no provee progreso real con fetch)
        setProgress(30);

        // Subir imagen
        const result = await uploadImageToCloudinary(file, entityType, folder);

        setProgress(100);
        setUploadedImage(result);

        // Callback de éxito
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al subir imagen';
        setError(errorMessage);

        // Callback de error
        if (onError && err instanceof Error) {
          onError(err);
        }

        return null;
      } finally {
        setUploading(false);
      }
    },
    [entityType, folder, maxSizeMB, onSuccess, onError]
  );

  /**
   * Sube múltiples imágenes a Cloudinary
   */
  const uploadMultipleImages = useCallback(
    async (files: File[]): Promise<CloudinaryUploadResult[]> => {
      setUploading(true);
      setError(null);
      setProgress(0);

      const results: CloudinaryUploadResult[] = [];
      const totalFiles = files.length;

      try {
        for (let i = 0; i < totalFiles; i++) {
          const file = files[i];

          // Validar cada archivo
          validateImageFile(file, maxSizeMB);

          // Subir imagen
          const result = await uploadImageToCloudinary(file, entityType, folder);
          results.push(result);

          // Actualizar progreso
          setProgress(Math.round(((i + 1) / totalFiles) * 100));

          // Callback de éxito por cada imagen
          if (onSuccess) {
            onSuccess(result);
          }
        }

        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al subir imágenes';
        setError(errorMessage);

        // Callback de error
        if (onError && err instanceof Error) {
          onError(err);
        }

        return results; // Retornar las que se subieron exitosamente
      } finally {
        setUploading(false);
      }
    },
    [entityType, folder, maxSizeMB, onSuccess, onError]
  );

  /**
   * Resetea el estado del hook
   */
  const resetState = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedImage(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadedImage,
    uploadImage,
    uploadMultipleImages,
    resetState,
  };
};
