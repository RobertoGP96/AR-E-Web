'use server';

import { auth } from '@/auth';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadImageAction(
  formData: FormData
): Promise<UploadResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Not authenticated' };

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
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    };
  }
}
