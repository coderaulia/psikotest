import { Hono } from 'hono';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../lib/password';
import { signAdminToken } from '../lib/jwt';
import { queryOne, run } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface AdminRow {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'psychologist_reviewer';
  status: 'active' | 'inactive';
  session_version: number;
}

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

// POST /api/auth/login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    const admin = await queryOne<AdminRow>(
      c.env.DB,
      `SELECT id, full_name, email, password_hash, role, status, session_version
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()],
    );

    if (!admin || admin.status !== 'active') {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last_login_at (best-effort)
    try {
      await run(
        c.env.DB,
        'UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id],
      );
    } catch {
      console.warn('[auth] Failed to update last_login_at');
    }

    const token = await signAdminToken(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
        sessionVersion: admin.session_version,
      },
      c.env.JWT_SECRET,
    );

    return c.json({
      token,
      admin: {
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// GET /api/auth/me
app.get('/me', requireAdmin, async (c) => {
  const payload = c.get('adminPayload');
  const admin = await queryOne<{ id: number; full_name: string; email: string; role: string }>(
    c.env.DB,
    'SELECT id, full_name, email, role FROM admins WHERE id = ? LIMIT 1',
    [payload.adminId],
  );

  if (!admin) {
    return c.json({ error: 'Admin not found' }, 404);
  }

  return c.json({
    admin: {
      id: admin.id,
      fullName: admin.full_name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// POST /api/auth/logout
app.post('/logout', requireAdmin, async (c) => {
  const payload = c.get('adminPayload');
  try {
    await run(
      c.env.DB,
      'UPDATE admins SET session_version = session_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [payload.adminId],
    );
  } catch {
    console.warn('[auth] Failed to revoke session');
  }
  return c.json({ success: true });
});

// POST /api/auth/set-password  (for migrating bcrypt hashes)
app.post('/set-password', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(body);
  const payload = c.get('adminPayload');
  const hash = await hashPassword(newPassword);
  await run(
    c.env.DB,
    'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hash, payload.adminId],
  );
  return c.json({ success: true });
});

// POST /api/auth/forgot-password - Request password reset
app.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin exists
    const admin = await queryOne<{ id: number; full_name: string; email: string }>(
      c.env.DB,
      'SELECT id, full_name, email FROM admins WHERE email = ? AND status = ? LIMIT 1',
      [normalizedEmail, 'active'],
    );

    if (!admin) {
      // Return success even if email not found (security best practice)
      return c.json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Save reset token
    await run(
      c.env.DB,
      `INSERT INTO password_resets (email, token, expires_at, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [normalizedEmail, resetToken, expiresAt],
    );

    // Log the reset request
    console.log(`[password-reset] Token generated for ${normalizedEmail}: ${resetToken}`);

    return c.json({
      success: true,
      message: 'If an account exists, a reset link has been sent',
      // In production, you would send an email here
      // For now, return the token for testing
      previewToken: resetToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

// POST /api/auth/reset-password - Confirm password reset
app.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, newPassword } = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    }).parse(body);

    // Find valid reset token
    const resetRecord = await queryOne<{ id: number; email: string; expires_at: string }>(
      c.env.DB,
      `SELECT id, email, expires_at FROM password_resets
       WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`,
      [token],
    );

    if (!resetRecord) {
      return c.json({ error: 'Invalid or expired reset token' }, 400);
    }

    // Check if admin still exists and is active
    const admin = await queryOne<{ id: number }>(
      c.env.DB,
      'SELECT id FROM admins WHERE email = ? AND status = ? LIMIT 1',
      [resetRecord.email, 'active'],
    );

    if (!admin) {
      return c.json({ error: 'Account not found or inactive' }, 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await run(
      c.env.DB,
      'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, admin.id],
    );

    // Mark token as used
    await run(
      c.env.DB,
      'UPDATE password_resets SET used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [resetRecord.id],
    );

    // Increment session version to invalidate existing sessions
    await run(
      c.env.DB,
      'UPDATE admins SET session_version = session_version + 1 WHERE id = ?',
      [admin.id],
    );

    return c.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
  }
});

export default app;