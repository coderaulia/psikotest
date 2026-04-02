import { Hono } from 'hono';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../lib/password';
import { signCustomerToken } from '../lib/jwt';
import { queryOne, run } from '../lib/db';
import { requireCustomer } from '../middleware/auth';
import type { CustomerJwtPayload, Env } from '../types';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.enum(['business', 'researcher']).default('business'),
  organizationName: z.string().min(2),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

// ─── Row Types ───────────────────────────────────────────────────────────────

interface CustomerRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
  status: 'active' | 'inactive';
  session_version: number;
}

interface WorkspaceMemberRow {
  id: number;
  customer_account_id: number;
  full_name: string;
  email: string;
  password_hash: string | null;
  role: 'admin' | 'operator' | 'reviewer';
  invitation_status: 'invited' | 'active';
  activation_token: string | null;
  activation_expires_at: string | null;
  session_version: number;
  account_type: 'business' | 'researcher';
  organization_name: string;
  customer_status: 'active' | 'inactive';
}

interface PasswordResetTokenRow {
  id: string;
  account_id: number;
  token_hash: string;
  expires_at: number;
  used_at: number | null;
  account_status: 'active' | 'inactive' | null;
}

interface PasswordResetRateLimitRow {
  email: string;
  window_start: number;
  request_count: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toUnixTimestamp(date = Date.now()) {
  return Math.floor(date / 1000);
}

function encodeHex(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createRandomToken() {
  return encodeHex(crypto.getRandomValues(new Uint8Array(32)));
}

async function hashResetToken(token: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return encodeHex(buffer);
}

async function consumeForgotPasswordRateLimit(db: D1Database, email: string) {
  const now = toUnixTimestamp();
  const windowSizeSeconds = 15 * 60;
  const existing = await queryOne<PasswordResetRateLimitRow>(
    db,
    'SELECT email, window_start, request_count FROM password_reset_request_limits WHERE email = ? LIMIT 1',
    [email],
  );

  if (!existing || now - existing.window_start >= windowSizeSeconds) {
    await run(
      db,
      `INSERT INTO password_reset_request_limits (email, window_start, request_count, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(email) DO UPDATE SET
         window_start = excluded.window_start,
         request_count = 1,
         updated_at = excluded.updated_at`,
      [email, now, now],
    );
    return true;
  }

  if (existing.request_count >= 3) {
    return false;
  }

  await run(
    db,
    `UPDATE password_reset_request_limits
     SET request_count = request_count + 1,
         updated_at = ?
     WHERE email = ?`,
    [now, email],
  );
  return true;
}

async function getPasswordResetTokenRecord(db: D1Database, token: string) {
  const tokenHash = await hashResetToken(token);
  return queryOne<PasswordResetTokenRow>(
    db,
    `SELECT prt.id, prt.account_id, prt.token_hash, prt.expires_at, prt.used_at,
            ca.status AS account_status
     FROM password_reset_tokens prt
     LEFT JOIN customer_accounts ca ON ca.id = prt.account_id
     WHERE prt.token_hash = ?
     LIMIT 1`,
    [tokenHash],
  );
}

function evaluatePasswordResetToken(record: PasswordResetTokenRow | null) {
  const now = toUnixTimestamp();

  if (!record || record.account_status !== 'active') {
    return { valid: false as const, reason: 'invalid' as const };
  }

  if (record.used_at) {
    return { valid: false as const, reason: 'used' as const };
  }

  if (record.expires_at <= now) {
    return { valid: false as const, reason: 'expired' as const };
  }

  return { valid: true as const };
}

async function buildOwnerSessionResponse(
  db: D1Database,
  customerId: number,
  secret: string,
) {
  const customer = await queryOne<CustomerRow>(
    db,
    'SELECT id, full_name, email, password_hash, account_type, organization_name, status, session_version FROM customer_accounts WHERE id = ? LIMIT 1',
    [customerId],
  );

  if (!customer) return null;

  const token = await signCustomerToken(
    {
      accountId: customer.id,
      actorId: customer.id,
      actorType: 'owner',
      email: customer.email,
      accountType: customer.account_type,
      workspaceRole: 'owner',
      sessionVersion: customer.session_version,
    },
    secret,
  );

  return {
    token,
    account: {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      accountType: customer.account_type,
      organizationName: customer.organization_name,
      workspaceRole: 'owner' as const,
      sessionSource: 'owner' as const,
      workspaceMemberId: null,
    },
  };
}

async function buildMemberSessionResponse(
  member: WorkspaceMemberRow,
  secret: string,
) {
  const token = await signCustomerToken(
    {
      accountId: member.customer_account_id,
      actorId: member.id,
      actorType: 'workspace_member',
      email: member.email,
      accountType: member.account_type,
      workspaceRole: member.role,
      sessionVersion: member.session_version,
    },
    secret,
  );

  return {
    token,
    account: {
      id: member.customer_account_id,
      fullName: member.full_name,
      email: member.email,
      accountType: member.account_type,
      organizationName: member.organization_name,
      workspaceRole: member.role,
      sessionSource: 'workspace_member' as const,
      workspaceMemberId: member.id,
    },
  };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env; Variables: { customerPayload: CustomerJwtPayload } }>();

// POST /api/site-auth/signup
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    const email = normalizeEmail(data.email);

    // Check for duplicate email (owner or member)
    const existingOwner = await queryOne<{ id: number }>(
      c.env.DB,
      'SELECT id FROM customer_accounts WHERE email = ? LIMIT 1',
      [email],
    );
    const existingMember = await queryOne<{ id: number }>(
      c.env.DB,
      "SELECT id FROM customer_workspace_members WHERE email = ? AND invitation_status = 'active' LIMIT 1",
      [email],
    );

    if (existingOwner || existingMember) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }

    const passwordHash = await hashPassword(data.password);
    const result = await run(
      c.env.DB,
      `INSERT INTO customer_accounts (full_name, email, password_hash, account_type, organization_name, status, session_version, last_login_at)
       VALUES (?, ?, ?, ?, ?, 'active', 1, CURRENT_TIMESTAMP)`,
      [data.fullName.trim(), email, passwordHash, data.accountType, data.organizationName.trim()],
    );

    const newId = result.meta.last_row_id;
    const response = await buildOwnerSessionResponse(c.env.DB, newId as number, c.env.JWT_SECRET);

    if (!response) {
      return c.json({ error: 'Failed to create account' }, 500);
    }

    return c.json(response, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// POST /api/site-auth/login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);
    const normalizedEmail = normalizeEmail(email);

    // Try owner login first
    const ownerRecord = await queryOne<CustomerRow>(
      c.env.DB,
      `SELECT id, full_name, email, password_hash, account_type, organization_name, status, session_version
       FROM customer_accounts
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
    );

    if (ownerRecord && ownerRecord.status === 'active') {
      const isValid = await verifyPassword(password, ownerRecord.password_hash);
      if (isValid) {
        try {
          await run(c.env.DB, 'UPDATE customer_accounts SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [ownerRecord.id]);
        } catch {
          console.warn('[site-auth] Failed to update last_login_at for owner');
        }
        const response = await buildOwnerSessionResponse(c.env.DB, ownerRecord.id, c.env.JWT_SECRET);
        return c.json(response);
      }
    }

    // Try workspace member login
    const memberRecord = await queryOne<WorkspaceMemberRow>(
      c.env.DB,
      `SELECT m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role,
              m.invitation_status, m.activation_token, m.activation_expires_at, m.session_version,
              ca.account_type, ca.organization_name, ca.status AS customer_status
       FROM customer_workspace_members m
       INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
       WHERE m.email = ?
         AND m.invitation_status = 'active'
         AND m.password_hash IS NOT NULL
         AND ca.status = 'active'
       LIMIT 1`,
      [normalizedEmail],
    );

    if (!memberRecord || !memberRecord.password_hash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isMemberValid = await verifyPassword(password, memberRecord.password_hash);
    if (!isMemberValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    try {
      await run(
        c.env.DB,
        'UPDATE customer_workspace_members SET last_login_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?',
        [memberRecord.id, memberRecord.customer_account_id],
      );
    } catch {
      console.warn('[site-auth] Failed to update last_login_at for member');
    }

    const response = await buildMemberSessionResponse(memberRecord, c.env.JWT_SECRET);
    return c.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// GET /api/site-auth/me
app.get('/me', requireCustomer, async (c) => {
  const payload = c.get('customerPayload');

  if (payload.actorType === 'workspace_member') {
    const member = await queryOne<WorkspaceMemberRow>(
      c.env.DB,
      `SELECT m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role,
              m.invitation_status, m.activation_token, m.activation_expires_at, m.session_version,
              ca.account_type, ca.organization_name, ca.status AS customer_status
       FROM customer_workspace_members m
       INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
       WHERE m.id = ? AND m.customer_account_id = ?
       LIMIT 1`,
      [payload.actorId, payload.accountId],
    );

    if (!member) return c.json({ error: 'Not found' }, 404);

    return c.json({
      account: {
        id: member.customer_account_id,
        fullName: member.full_name,
        email: member.email,
        accountType: member.account_type,
        organizationName: member.organization_name,
        workspaceRole: member.role,
        sessionSource: 'workspace_member',
        workspaceMemberId: member.id,
      },
    });
  }

  const customer = await queryOne<CustomerRow>(
    c.env.DB,
    'SELECT id, full_name, email, account_type, organization_name FROM customer_accounts WHERE id = ? LIMIT 1',
    [payload.accountId],
  );

  if (!customer) return c.json({ error: 'Not found' }, 404);

  return c.json({
    account: {
      id: customer.id,
      fullName: customer.full_name,
      email: customer.email,
      accountType: customer.account_type,
      organizationName: customer.organization_name,
      workspaceRole: 'owner',
      sessionSource: 'owner',
      workspaceMemberId: null,
    },
  });
});

// POST /api/site-auth/logout
app.post('/logout', requireCustomer, async (c) => {
  const payload = c.get('customerPayload');

  try {
    if (payload.actorType === 'workspace_member') {
      await run(
        c.env.DB,
        'UPDATE customer_workspace_members SET session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?',
        [payload.actorId, payload.accountId],
      );
    } else {
      await run(
        c.env.DB,
        'UPDATE customer_accounts SET session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [payload.accountId],
      );
    }
  } catch {
    console.warn('[site-auth] Failed to revoke session');
  }

  return c.json({ success: true });
});

// GET /api/site-auth/invite/:token  — preview invite before accepting
app.get('/invite/:token', async (c) => {
  const token = c.req.param('token');

  const member = await queryOne<WorkspaceMemberRow>(
    c.env.DB,
    `SELECT m.id, m.customer_account_id, m.full_name, m.email, m.role,
            m.invitation_status, m.activation_token, m.activation_expires_at, m.session_version,
            ca.account_type, ca.organization_name, ca.status AS customer_status
     FROM customer_workspace_members m
     INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
     WHERE m.activation_token = ?
       AND m.invitation_status = 'invited'
       AND ca.status = 'active'
     LIMIT 1`,
    [token],
  );

  if (!member) {
    return c.json({ error: 'Invitation not found or already used' }, 404);
  }

  const isExpired = member.activation_expires_at
    ? new Date(member.activation_expires_at).getTime() <= Date.now()
    : false;

  return c.json({
    invite: {
      organizationName: member.organization_name,
      accountType: member.account_type,
      fullName: member.full_name,
      email: member.email,
      role: member.role,
      expiresAt: member.activation_expires_at,
      isExpired,
    },
  });
});

// POST /api/site-auth/invite/accept
app.post('/invite/accept', async (c) => {
  try {
    const body = await c.req.json();
    const { token, fullName, password } = acceptInviteSchema.parse(body);

    const member = await queryOne<WorkspaceMemberRow>(
      c.env.DB,
      `SELECT m.id, m.customer_account_id, m.full_name, m.email, m.role,
              m.invitation_status, m.activation_expires_at, m.session_version,
              ca.account_type, ca.organization_name, ca.status AS customer_status
       FROM customer_workspace_members m
       INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
       WHERE m.activation_token = ?
         AND m.invitation_status = 'invited'
         AND ca.status = 'active'
       LIMIT 1`,
      [token],
    );

    if (!member) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    if (member.activation_expires_at && new Date(member.activation_expires_at).getTime() <= Date.now()) {
      return c.json({ error: 'Invitation has expired' }, 410);
    }

    const passwordHash = await hashPassword(password);
    await run(
      c.env.DB,
      `UPDATE customer_workspace_members
       SET full_name = ?,
           password_hash = ?,
           invitation_status = 'active',
           activation_token = NULL,
           activation_expires_at = NULL,
           activated_at = CURRENT_TIMESTAMP,
           last_login_at = CURRENT_TIMESTAMP,
           session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND customer_account_id = ? AND invitation_status = 'invited'`,
      [fullName.trim(), passwordHash, member.id, member.customer_account_id],
    );

    // Re-fetch to get updated session_version
    const activatedMember = await queryOne<WorkspaceMemberRow>(
      c.env.DB,
      `SELECT m.id, m.customer_account_id, m.full_name, m.email, m.password_hash, m.role,
              m.invitation_status, m.activation_token, m.activation_expires_at, m.session_version,
              ca.account_type, ca.organization_name, ca.status AS customer_status
       FROM customer_workspace_members m
       INNER JOIN customer_accounts ca ON ca.id = m.customer_account_id
       WHERE m.id = ? LIMIT 1`,
      [member.id],
    );

    if (!activatedMember) {
      return c.json({ error: 'Failed to activate invitation' }, 500);
    }

    const response = await buildMemberSessionResponse(activatedMember, c.env.JWT_SECRET);
    return c.json(response, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// POST /api/site-auth/forgot-password
app.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = normalizeEmail(email);

    const withinLimit = await consumeForgotPasswordRateLimit(c.env.DB, normalizedEmail);
    if (!withinLimit) {
      return c.json({ success: true });
    }

    const customer = await queryOne<{ id: number; email: string }>(
      c.env.DB,
      "SELECT id, email FROM customer_accounts WHERE email = ? AND status = 'active' LIMIT 1",
      [normalizedEmail],
    );

    if (!customer) {
      return c.json({ success: true });
    }

    const rawToken = createRandomToken();
    const tokenHash = await hashResetToken(rawToken);
    const expiresAt = toUnixTimestamp(Date.now() + 60 * 60 * 1000);
    const usedAt = toUnixTimestamp();

    await run(
      c.env.DB,
      'UPDATE password_reset_tokens SET used_at = ? WHERE account_id = ? AND used_at IS NULL',
      [usedAt, customer.id],
    );

    await run(
      c.env.DB,
      `INSERT INTO password_reset_tokens (id, account_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), customer.id, tokenHash, expiresAt, toUnixTimestamp()],
    );

    const appOrigin = c.env.APP_ORIGIN ?? 'https://psikotest.vanaila.com';
    const resetLink = `${appOrigin}/reset-password?token=${rawToken}`;
    console.log(`[site-auth/password-reset] TODO send email to ${customer.email}: ${resetLink}`);

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// GET /api/site-auth/reset-password/validate?token=xxx
app.get('/reset-password/validate', async (c) => {
  const token = c.req.query('token')?.trim();

  if (!token) {
    return c.json({ valid: false, reason: 'invalid' as const });
  }

  const tokenRecord = await getPasswordResetTokenRecord(c.env.DB, token);
  const validation = evaluatePasswordResetToken(tokenRecord);

  if (!validation.valid) {
    return c.json(validation);
  }

  return c.json({ valid: true });
});

// POST /api/site-auth/reset-password
app.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, newPassword } = resetPasswordSchema.parse(body);

    const tokenRecord = await getPasswordResetTokenRecord(c.env.DB, token);
    const validation = evaluatePasswordResetToken(tokenRecord);

    if (!validation.valid || !tokenRecord) {
      return c.json(
        {
          error: 'Reset token is invalid or expired',
          reason: validation.reason,
        },
        400,
      );
    }

    const passwordHash = await hashPassword(newPassword);
    const usedAt = toUnixTimestamp();

    await run(
      c.env.DB,
      `UPDATE customer_accounts
       SET password_hash = ?, session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'active'`,
      [passwordHash, tokenRecord.account_id],
    );

    await run(
      c.env.DB,
      `UPDATE password_reset_tokens
       SET used_at = ?
       WHERE id = ? AND used_at IS NULL`,
      [usedAt, tokenRecord.id],
    );

    return c.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// POST /api/site-auth/change-password - Authenticated customer changes own password
app.post('/change-password', requireCustomer, async (c) => {
  try {
    const body = await c.req.json();
    const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(body);
    const payload = c.get('customerPayload');

    const passwordHash = await hashPassword(newPassword);

    if (payload.actorType === 'workspace_member') {
      await run(
        c.env.DB,
        'UPDATE customer_workspace_members SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND customer_account_id = ?',
        [passwordHash, payload.actorId, payload.accountId],
      );
    } else {
      await run(
        c.env.DB,
        'UPDATE customer_accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [passwordHash, payload.accountId],
      );
    }

    return c.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;
