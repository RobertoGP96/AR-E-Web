'use server';

import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { requireStaff } from '@/lib/action-helpers';

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadImageAction(
  formData: FormData
): Promise<UploadResult> {
  const { denied } = await requireStaff();
  if (denied) return { ok: false, error: denied.error };

  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      error: 'Image upload is not configured on the server',
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No file provided' };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'File too large (max 8 MB)' };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Only image files are allowed' };
  }

  try {
    const url = await uploadToCloudinary(file);
    return { ok: true, url };
  } catch (err) {
    // Don't leak upstream (Cloudinary) error detail to the client.
    console.error('Image upload failed:', err);
    return { ok: false, error: 'Upload failed — try again' };
  }
}
