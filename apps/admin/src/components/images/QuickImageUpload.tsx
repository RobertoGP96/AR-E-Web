import React from 'react';
import { ImageUploader } from './ImageUploader';
import type { EntityType } from '@/services/cloudinaryService';

interface QuickImageUploadProps {
  entityType: EntityType;
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  folder?: string;
  label?: string;
}

/**
 * Componente simplificado para subir una sola imagen rápidamente
 * Ideal para formularios donde solo necesitas una imagen
 */
export const QuickImageUpload: React.FC<QuickImageUploadProps> = ({
  entityType,
  onImageUploaded,
  currentImage,
  folder,
  label,
}) => {
  const handleChange = (urls: string | string[]) => {
    const url = Array.isArray(urls) ? urls[0] : urls;
    if (url) {
      onImageUploaded(url);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <ImageUploader
        entityType={entityType}
        folder={folder}
        multiple={false}
        maxSizeMB={10}
        value={currentImage}
        onChange={handleChange}
      />
    </div>
  );
};

interface MultiImageUploadProps {
  entityType: EntityType;
  onImagesUploaded: (urls: string[]) => void;
  currentImages?: string[];
  folder?: string;
  label?: string;
  maxImages?: number;
}

/**
 * Componente simplificado para subir múltiples imágenes
 * Ideal para galerías de productos
 */
export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  entityType,
  onImagesUploaded,
  currentImages = [],
  folder,
  label,
  maxImages,
}) => {
  const handleChange = (urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    // Limitar número de imágenes si se especifica maxImages
    const limitedUrls = maxImages ? urlArray.slice(0, maxImages) : urlArray;
    
    onImagesUploaded(limitedUrls);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {maxImages && (
            <span className="text-muted-foreground ml-2 font-normal">
              (máximo {maxImages} imagen{maxImages > 1 ? 'es' : ''})
            </span>
          )}
        </label>
      )}
      <ImageUploader
        entityType={entityType}
        folder={folder}
        multiple={true}
        maxSizeMB={10}
        value={currentImages}
        onChange={handleChange}
      />
      {maxImages && currentImages.length >= maxImages && (
        <p className="text-xs text-yellow-600">
          Has alcanzado el límite de {maxImages} imagen{maxImages > 1 ? 'es' : ''}
        </p>
      )}
    </div>
  );
};
