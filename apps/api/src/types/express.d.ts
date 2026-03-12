import type { AdminSessionClaims, CustomerSessionClaims } from '../lib/signed-token.js';

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSessionClaims;
      customerSession?: CustomerSessionClaims;
    }
  }
}

export {};
