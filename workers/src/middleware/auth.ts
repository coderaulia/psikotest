import type { MiddlewareHandler } from 'hono';
import type { AdminJwtPayload, CustomerJwtPayload, Env } from '../types';
import { extractBearer, verifyToken } from '../lib/jwt';
import { queryOne } from '../lib/db';

// ─── Admin Auth Middleware ────────────────────────────────────────────────────

type AdminEnv = { Bindings: Env; Variables: { adminPayload: AdminJwtPayload } };
type CustomerEnv = { Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } };

export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const token = extractBearer(c.req.header('Authorization'));
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = (await verifyToken(token, c.env.JWT_SECRET)) as unknown as AdminJwtPayload;

    const admin = await queryOne<{ id: number; status: string; session_version: number }>(
      c.env.DB,
      'SELECT id, status, session_version FROM admins WHERE id = ? LIMIT 1',
      [payload.adminId],
    );

    if (!admin || admin.status !== 'active' || admin.session_version !== payload.sessionVersion) {
      return c.json({ error: 'Session expired or revoked' }, 401);
    }

    c.set('adminPayload', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

/** Super-admin guard — compose on top of requireAdmin */
export const requireSuperAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  // Re-use requireAdmin logic inline to avoid Context casting issues
  const token = extractBearer(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const payload = (await verifyToken(token, c.env.JWT_SECRET)) as unknown as AdminJwtPayload;

    const admin = await queryOne<{ id: number; status: string; session_version: number }>(
      c.env.DB,
      'SELECT id, status, session_version FROM admins WHERE id = ? LIMIT 1',
      [payload.adminId],
    );

    if (!admin || admin.status !== 'active' || admin.session_version !== payload.sessionVersion) {
      return c.json({ error: 'Session expired or revoked' }, 401);
    }

    if (payload.role !== 'super_admin') {
      return c.json({ error: 'Super admin access required' }, 403);
    }

    c.set('adminPayload', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

// ─── Customer Auth Middleware ─────────────────────────────────────────────────

export const requireCustomer: MiddlewareHandler<CustomerEnv> = async (c, next) => {
  const token = extractBearer(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const payload = (await verifyToken(token, c.env.JWT_SECRET)) as unknown as CustomerJwtPayload;

    if (payload.actorType === 'workspace_member') {
      const member = await queryOne<{ id: number; session_version: number; invitation_status: string }>(
        c.env.DB,
        'SELECT id, session_version, invitation_status FROM customer_workspace_members WHERE id = ? AND customer_account_id = ? LIMIT 1',
        [payload.actorId, payload.accountId],
      );

      if (!member || member.session_version !== payload.sessionVersion || member.invitation_status !== 'active') {
        return c.json({ error: 'Session expired or revoked' }, 401);
      }
    } else {
      const account = await queryOne<{ id: number; status: string; session_version: number }>(
        c.env.DB,
        'SELECT id, status, session_version FROM customer_accounts WHERE id = ? LIMIT 1',
        [payload.accountId],
      );

      if (!account || account.status !== 'active' || account.session_version !== payload.sessionVersion) {
        return c.json({ error: 'Session expired or revoked' }, 401);
      }
    }

    c.set('customerPayload', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};
