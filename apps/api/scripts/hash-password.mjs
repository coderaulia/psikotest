import { hashPassword } from '../src/lib/password.js';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <plain-password>');
  process.exit(1);
}

const hash = await hashPassword(password);
console.log(hash);
