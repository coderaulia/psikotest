/**
 * Password hashing using Web Crypto API (Workers-compatible, no bcrypt).
 * Uses PBKDF2 with SHA-256.
 *
 * NOTE: Existing bcrypt hashes from the MySQL API cannot be verified here.
 * During migration, admins must reset their passwords, or use the hash-compat
 * approach below that recognises a "$2b$" prefix as a bcrypt hash and rejects
 * it gracefully so the user knows to reset.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes → 64 hex chars
const HASH_PREFIX = 'pbkdf2v1';

function uint8ToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS } as Pbkdf2Params,
    keyMaterial,
    KEY_LENGTH * 8,
  );
  const hash = new Uint8Array(bits);
  return `${HASH_PREFIX}:${uint8ToHex(salt)}:${uint8ToHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Reject legacy bcrypt hashes from the old MySQL API
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
    return false;
  }

  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const [, saltHex, hashHex] = parts;
  const salt = hexToUint8(saltHex);
  const expectedHash = hexToUint8(hashHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations: ITERATIONS } as Pbkdf2Params,
    keyMaterial,
    KEY_LENGTH * 8,
  );

  const actualHash = new Uint8Array(bits);

  // Constant-time comparison
  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < actualHash.length; i++) {
    diff |= actualHash[i] ^ expectedHash[i];
  }
  return diff === 0;
}
