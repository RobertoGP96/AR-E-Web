/**
 * Servicio de carga de imágenes
 * Soporta Cloudinary y Supabase Storage
 */

// Tipos
export interface UploadResult {
  url: string;
  publicId?: string;
  error?: string;
}

export type ImageProvider = 'cloudinary' | 'supabase';

// ============= CLOUDINARY =============
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

export const uploadToCloudinary = async (
  file: File,
  folder: string = 'products'
): Promise<UploadResult> => {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary no está configurado');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir imagen a Cloudinary');
    }

    const data: CloudinaryUploadResponse = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const deleteFromCloudinary = async (
  publicId: string
): Promise<boolean> => {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary no está configurado para eliminación');
    }

    // Generar signature (necesitas implementar esto en el backend por seguridad)
    // Por ahora, solo retornamos true pero logueamos el publicId
    console.warn('Eliminación de Cloudinary debe hacerse desde el backend', publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

// ============= SUPABASE STORAGE =============
import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase no está configurado');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

export const uploadToSupabase = async (
  file: File,
  bucket: string = 'images',
  folder: string = 'products'
): Promise<UploadResult> => {
  try {
    const supabase = getSupabaseClient();

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      publicId: data.path,
    };
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const deleteFromSupabase = async (
  path: string,
  bucket: string = 'images'
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    return false;
  }
};

// ============= FUNCIÓN UNIVERSAL =============
export const uploadImage = async (
  file: File,
  provider: ImageProvider = 'cloudinary',
  folder: string = 'products'
): Promise<UploadResult> => {
  // Validar tipo de archivo
  if (!file.type.startsWith('image/')) {
    return {
      url: '',
      error: 'El archivo debe ser una imagen',
    };
  }

  // Validar tamaño (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      url: '',
      error: 'La imagen no puede superar los 5MB',
    };
  }

  if (provider === 'cloudinary') {
    return uploadToCloudinary(file, folder);
  } else {
    return uploadToSupabase(file, 'images', folder);
  }
};

export const deleteImage = async (
  publicId: string,
  provider: ImageProvider = 'cloudinary'
): Promise<boolean> => {
  if (provider === 'cloudinary') {
    return deleteFromCloudinary(publicId);
  } else {
    return deleteFromSupabase(publicId);
  }
};
