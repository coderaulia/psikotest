import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <plain-password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const derivedKey = await scrypt(password, salt, KEY_LENGTH);
console.log(`scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`);
