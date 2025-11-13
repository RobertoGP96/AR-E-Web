import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

// Configuración de Cloudinary desde variables de entorno
const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME || 'ditwmsrsh';
const UPLOAD_PRESET = 'arye_products'; // Debe configurarse en Cloudinary Dashboard

// Tipos de entidad para organizar uploads
export type EntityType = 'products' | 'packages' | 'deliveries';

// Tipo para resultado de upload
export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
}

// Inicializar cliente de Cloudinary
export const cld = new Cloudinary({ 
  cloud: { 
    cloudName: CLOUD_NAME 
  } 
});

/**
 * Sube una imagen a Cloudinary
 * @param file - Archivo a subir
 * @param entityType - Tipo de entidad (products, packages, deliveries)
 * @param folder - Carpeta opcional dentro del tipo de entidad
 * @returns Resultado del upload con URLs e información de la imagen
 */
export const uploadImageToCloudinary = async (
  file: File,
  entityType: EntityType,
  folder?: string
): Promise<CloudinaryUploadResult> => {
  // Crear FormData para enviar el archivo
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Construir la carpeta de destino
  const targetFolder = folder ? `arye_system/${entityType}/${folder}` : `arye_system/${entityType}`;
  formData.append('folder', targetFolder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al subir imagen a Cloudinary');
    }

    const data = await response.json();

    return {
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
      width: data.width,
      height: data.height,
      format: data.format,
      resourceType: data.resource_type,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param publicId - ID público de la imagen en Cloudinary
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
  // Nota: La eliminación requiere autenticación con API Key/Secret
  // Esto debe hacerse desde el backend por seguridad
  console.warn('La eliminación debe realizarse desde el backend por seguridad', { publicId });
  throw new Error('Usar endpoint del backend para eliminar imágenes');
};

/**
 * Obtiene una imagen optimizada de Cloudinary
 * @param publicId - ID público de la imagen
 * @param width - Ancho deseado
 * @param height - Alto deseado
 * @returns Instancia de imagen de Cloudinary
 */
export const getOptimizedImage = (publicId: string, width = 500, height = 500) => {
  return cld
    .image(publicId)
    .format('auto')
    .quality('auto')
    .resize(auto().gravity(autoGravity()).width(width).height(height));
};

/**
 * Obtiene la URL de una imagen con transformaciones
 * @param publicId - ID público de la imagen
 * @param transformations - Transformaciones a aplicar
 * @returns URL de la imagen transformada
 */
export const getImageUrl = (publicId: string, transformations?: string): string => {
  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  return transformations 
    ? `${baseUrl}/${transformations}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

/**
 * Valida si un archivo es una imagen válida
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (por defecto 10MB)
 * @returns true si es válido, lanza error si no lo es
 */
export const validateImageFile = (file: File, maxSizeMB = 10): boolean => {
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no válido. Solo se permiten: JPG, PNG, GIF, WEBP');
  }

  // Validar tamaño
  const maxSize = maxSizeMB * 1024 * 1024; // Convertir MB a bytes
  if (file.size > maxSize) {
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
  }

  return true;
};
