import type { AdminSessionClaims } from '../lib/signed-token.js';

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSessionClaims;
    }
  }
}

export {};
