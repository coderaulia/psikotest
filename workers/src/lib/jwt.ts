import { sign, verify } from 'hono/jwt';
import type { AdminJwtPayload, CustomerJwtPayload } from '../types';

const ADMIN_TTL_SECONDS = 60 * 60 * 24;         // 24 hours
const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 7;  // 7 days

export function adminExp(): number {
  return Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS;
}

export function customerExp(): number {
  return Math.floor(Date.now() / 1000) + CUSTOMER_TTL_SECONDS;
}

export async function signAdminToken(
  payload: Omit<AdminJwtPayload, 'sub' | 'exp'>,
  secret: string,
): Promise<string> {
  return sign(
    {
      sub: String(payload.adminId),
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
      sessionVersion: payload.sessionVersion,
      exp: adminExp(),
    },
    secret,
  );
}

export async function signCustomerToken(
  payload: Omit<CustomerJwtPayload, 'sub' | 'exp'>,
  secret: string,
): Promise<string> {
  return sign(
    {
      sub: String(payload.accountId),
      accountId: payload.accountId,
      actorId: payload.actorId,
      actorType: payload.actorType,
      email: payload.email,
      accountType: payload.accountType,
      workspaceRole: payload.workspaceRole,
      sessionVersion: payload.sessionVersion,
      exp: customerExp(),
    },
    secret,
  );
}

export async function verifyToken(token: string, secret: string): Promise<Record<string, unknown>> {
  return verify(token, secret, 'HS256') as Promise<Record<string, unknown>>;
}

/** Extract Bearer token from Authorization header, or null */
export function extractBearer(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
