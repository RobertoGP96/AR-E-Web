/**
 * Exportaciones del sistema de subida de imágenes a Cloudinary
 */

// Componente principal
export { ImageUploader } from './ImageUploader';

// Componentes simplificados
export { QuickImageUpload, MultiImageUpload } from './QuickImageUpload';

// Hook personalizado
export { useCloudinary } from '@/hooks/useCloudinary';

// Servicios y utilidades
export {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  getOptimizedImage,
  getImageUrl,
  validateImageFile,
  cld,
  type EntityType,
  type CloudinaryUploadResult,
} from '@/services/cloudinaryService';
