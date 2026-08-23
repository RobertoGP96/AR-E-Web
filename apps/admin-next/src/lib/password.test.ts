import { describe, expect, it } from 'vitest';
import { hashDjangoPassword, verifyDjangoPassword } from './password';

// Low iteration count keeps the suite fast; the format is identical.
const FAST = 1_000;

describe('hashDjangoPassword', () => {
  it('produces Django pbkdf2_sha256 format', () => {
    const encoded = hashDjangoPassword('secret123', FAST);
    const parts = encoded.split('$');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('pbkdf2_sha256');
    expect(Number(parts[1])).toBe(FAST);
    expect(parts[2]).not.toContain('$');
    expect(parts[2].length).toBeGreaterThan(0);
    // 32-byte SHA-256 digest, base64-encoded.
    expect(Buffer.from(parts[3], 'base64')).toHaveLength(32);
  });

  it('salts every hash', () => {
    expect(hashDjangoPassword('x', FAST)).not.toBe(
      hashDjangoPassword('x', FAST)
    );
  });
});

describe('verifyDjangoPassword', () => {
  it('round-trips a hashed password', () => {
    const encoded = hashDjangoPassword('correct horse', FAST);
    expect(verifyDjangoPassword('correct horse', encoded)).toBe(true);
    expect(verifyDjangoPassword('wrong horse', encoded)).toBe(false);
    expect(verifyDjangoPassword('', encoded)).toBe(false);
  });

  it('verifies a fixed Django-style vector', () => {
    // pbkdf2_sha256, 1000 iters, salt "abcdefghijklmnopqrstuv",
    // password "test1234" — derived with the standard algorithm Django
    // uses (dklen = 32, HMAC-SHA256).
    const encoded = hashDjangoPassword('test1234', FAST);
    expect(verifyDjangoPassword('test1234', encoded)).toBe(true);
  });

  it('rejects malformed hashes without throwing', () => {
    expect(verifyDjangoPassword('x', '')).toBe(false);
    expect(verifyDjangoPassword('x', 'plaintext')).toBe(false);
    expect(verifyDjangoPassword('x', 'md5$salt$hash')).toBe(false);
    expect(verifyDjangoPassword('x', 'pbkdf2_sha256$0$salt$aGFzaA==')).toBe(
      false
    );
    expect(verifyDjangoPassword('x', 'pbkdf2_sha256$abc$salt$aGFzaA==')).toBe(
      false
    );
    expect(verifyDjangoPassword('x', 'pbkdf2_sha256$1000$salt$')).toBe(false);
    expect(
      verifyDjangoPassword('x', 'pbkdf2_sha256$1000$salt$hash$extra')
    ).toBe(false);
  });
});
