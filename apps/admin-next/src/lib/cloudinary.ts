import { createHash } from 'node:crypto';

/**
 * Server-side Cloudinary upload. Mirrors the backend's Cloudinary image
 * storage (CLOUDINARY_* env vars shared with Django). The api_secret
 * never leaves the server — we sign the request and stream the file to
 * Cloudinary's REST API.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER ?? 'ar-e-admin';

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

function sign(params: Record<string, string>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1')
    .update(`${toSign}${API_SECRET}`)
    .digest('hex');
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured (CLOUDINARY_* env vars)');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = sign({ folder: FOLDER, timestamp });

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', API_KEY!);
  body.append('timestamp', timestamp);
  body.append('folder', FOLDER);
  body.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) {
    throw new Error('Cloudinary response missing secure_url');
  }
  return json.secure_url;
}
