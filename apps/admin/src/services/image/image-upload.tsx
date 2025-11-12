/**
 * Componente de carga de imágenes
 * Incluye preview, drag & drop y validaciones
 */
import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

import { Button } from '../../../../client/src/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadImage, type ImageProvider } from '@/lib/imageUpload';

interface ImageUploadProps {
  onUploadSuccess: (url: string, publicId?: string) => void;
  onUploadError?: (error: string) => void;
  provider?: ImageProvider;
  folder?: string;
  currentImage?: string;
  className?: string;
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  provider = 'cloudinary',
  folder = 'products',
  currentImage,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir imagen
    setUploading(true);
    try {
      const result = await uploadImage(file, provider, folder);

      if (result.error) {
        throw new Error(result.error);
      }

      onUploadSuccess(result.url, result.publicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al subir imagen';
      onUploadError?.(message);
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          {!uploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'w-full h-48 border-2 border-dashed rounded-lg',
            'flex flex-col items-center justify-center',
            'cursor-pointer transition-colors',
            'hover:bg-accent/50',
            dragActive && 'border-primary bg-accent/50',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-accent p-3 mb-3">
                {dragActive ? (
                  <Upload className="h-8 w-8 text-primary" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium mb-1">
                {dragActive ? 'Suelta la imagen aquí' : 'Haz clic o arrastra una imagen'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF hasta 5MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
