import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_ITERATIONS = 600_000;

/**
 * Hash a plaintext password in Django's pbkdf2_sha256 format so the
 * existing Django backend (which shares this DB) can also verify it.
 * Format: pbkdf2_sha256$<iterations>$<salt>$<base64_hash>
 * Salt must not contain "$" (the field separator).
 */
export function hashDjangoPassword(
  plain: string,
  iterations: number = DEFAULT_ITERATIONS
): string {
  const salt = randomBytes(18)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, 22);
  const derived = pbkdf2Sync(plain, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${derived.toString('base64')}`;
}

/**
 * Verify a plaintext password against a Django pbkdf2_sha256 hash.
 * Format: pbkdf2_sha256$<iterations>$<salt>$<base64_hash>
 */
export function verifyDjangoPassword(plain: string, encoded: string): boolean {
  const parts = encoded.split('$');
  if (parts.length !== 4) return false;
  const [algorithm, iterationsStr, salt, b64Hash] = parts;
  if (algorithm !== 'pbkdf2_sha256') return false;
  const iterations = Number.parseInt(iterationsStr, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(b64Hash, 'base64');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const derived = pbkdf2Sync(plain, salt, iterations, expected.length, 'sha256');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
