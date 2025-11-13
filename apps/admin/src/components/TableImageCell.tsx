import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { AdvancedImage } from '@cloudinary/react';
import { getOptimizedImage } from '@/services/cloudinaryService';
import { cn } from '@/lib/utils';

interface TableImageCellProps {
  imageUrl?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  fallbackIcon?: boolean;
}

export const TableImageCell: React.FC<TableImageCellProps> = ({
  imageUrl,
  alt = 'Imagen',
  size = 48,
  className,
  fallbackIcon = true,
}) => {
  // Si no hay imagen, mostrar fallback
  if (!imageUrl) {
    return fallbackIcon ? (
      <div
        className={cn(
          'flex items-center justify-center bg-muted rounded',
          className
        )}
        style={{ width: size, height: size }}
      >
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
      </div>
    ) : null;
  }

  // Determinar si es una imagen de Cloudinary
  const isCloudinaryImage = imageUrl.includes('cloudinary');

  return (
    <div
      className={cn('overflow-hidden rounded border bg-muted', className)}
      style={{ width: size, height: size }}
    >
      {isCloudinaryImage ? (
        <AdvancedImage
          cldImg={getOptimizedImage(
            imageUrl.split('/').pop()?.split('.')[0] || '',
            size,
            size
          )}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
};
