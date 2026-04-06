import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { scrypt } from '@noble/hashes/scrypt.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';
import type { Env } from '../index';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const app = new Hono<{ Bindings: Env }>();

function verifyScryptPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length < 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = hexToBytes(parts[1]);
    const hash = parts[2];
    const key = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 64 });
    return bytesToHex(key) === hash;
  } catch (e) {
    console.error('Password verification error:', e);
    return false;
  }
}

// Admin login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);
    
    // Query admin from D1 database
    const result = await c.env.DB.prepare(
      'SELECT id, full_name, email, password_hash, role, status FROM admins WHERE email = ?'
    ).bind(email).first();
    
    if (!result) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Check if account is active
    if (result.status !== 'active') {
      return c.json({ error: 'Account is not active' }, 401);
    }

    // Verify password
    if (!verifyScryptPassword(password, result.password_hash as string)) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE admins SET last_login_at = ? WHERE id = ?'
    ).bind(new Date().toISOString().slice(0, 19).replace('T', ' '), result.id).run();

    const token = await sign({ 
      sub: String(result.id), 
      email: result.email, 
      role: result.role,
      type: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      admin: {
        id: result.id,
        fullName: result.full_name,
        email: result.email,
        role: result.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    console.error('Admin login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify token
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    
    const admin = await c.env.DB.prepare(
      'SELECT id, full_name, email, role, status FROM admins WHERE id = ?'
    ).bind(payload.sub as string).first();
    
    if (!admin) {
      return c.json({ error: 'Admin not found' }, 404);
    }
    
    return c.json({ 
      admin: {
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Logout
app.post('/logout', (c) => {
  return c.json({ success: true });
});

export default app;