import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdvancedImage } from '@cloudinary/react';
import { useCloudinary } from '@/hooks/useCloudinary';
import { getOptimizedImage, type EntityType, type CloudinaryUploadResult } from '@/services/cloudinaryService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  entityType: EntityType;
  folder?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  value?: string | string[];
  onChange?: (urls: string | string[]) => void;
  onUploadComplete?: (result: CloudinaryUploadResult | CloudinaryUploadResult[]) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  entityType,
  folder,
  maxSizeMB = 10,
  multiple = false,
  value,
  onChange,
  onUploadComplete,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedResults, setUploadedResults] = useState<CloudinaryUploadResult[]>([]);

  const { uploading, progress, error, uploadImage, uploadMultipleImages, resetState } = useCloudinary({
    entityType,
    folder,
    maxSizeMB,
    onSuccess: (result) => {
      setUploadedResults((prev) => [...prev, result]);
    },
  });

  // Inicializar previews desde value
  React.useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      setPreviewUrls(urls.filter(Boolean));
    }
  }, [value]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    resetState();

    // Crear previews locales
    const newPreviews = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setPreviewUrls((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));

    // Subir imágenes
    try {
      let results: CloudinaryUploadResult[];

      if (multiple && files.length > 1) {
        results = await uploadMultipleImages(files);
      } else {
        const result = await uploadImage(files[0]);
        results = result ? [result] : [];
      }

      if (results.length > 0) {
        // Actualizar previews con URLs de Cloudinary
        const cloudinaryUrls = results.map((r) => r.secureUrl);
        setPreviewUrls((prev) => {
          const filtered = prev.filter((url) => !url.startsWith('data:'));
          return multiple ? [...filtered, ...cloudinaryUrls] : cloudinaryUrls;
        });

        // Notificar cambios
        if (onChange) {
          const allUrls = multiple
            ? [...(Array.isArray(value) ? value : []), ...cloudinaryUrls]
            : cloudinaryUrls[0];
          onChange(allUrls);
        }

        if (onUploadComplete) {
          onUploadComplete(multiple ? results : results[0]);
        }
      }
    } catch (err) {
      console.error('Error uploading files:', err);
    }
  }, [multiple, resetState, uploadMultipleImages, uploadImage, onChange, onUploadComplete, value]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        await handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        await handleFiles(files);
      }
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newPreviews);

    const newResults = uploadedResults.filter((_, i) => i !== index);
    setUploadedResults(newResults);

    if (onChange) {
      onChange(multiple ? newPreviews : newPreviews[0] || '');
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Zona de Drop */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            uploading && 'pointer-events-none opacity-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileInput}
            disabled={uploading}
          />

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              {dragActive ? 'Suelta las imágenes aquí' : 'Arrastra imágenes aquí'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              o haz clic para seleccionar {multiple ? 'archivos' : 'un archivo'}
            </p>
            <Button type="button" variant="secondary" size="sm" disabled={uploading}>
              Seleccionar {multiple ? 'Imágenes' : 'Imagen'}
            </Button>
          </label>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Formatos: JPG, PNG, GIF, WEBP • Máximo {maxSizeMB}MB
          </p>
        </div>

        {/* Barra de Progreso */}
        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Subiendo... {progress}%
            </p>
          </div>
        )}

        {/* Mensajes de Error */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview de Imágenes */}
        {previewUrls.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Imágenes {uploadedResults.length > 0 && '(Subidas)'}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                >
                  {url.startsWith('data:') ? (
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : url.includes('cloudinary') ? (
                    <AdvancedImage
                      cldImg={getOptimizedImage(
                        url.split('/').pop()?.split('.')[0] || '',
                        300,
                        300
                      )}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Indicador de subida exitosa */}
                  {uploadedResults[index] && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}

                  {/* Botón de eliminar */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
