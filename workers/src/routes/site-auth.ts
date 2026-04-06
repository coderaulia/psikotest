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

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
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

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 64 });
  return `scrypt$${bytesToHex(salt)}$${bytesToHex(key)}`;
}

// Customer signup
app.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM customer_accounts WHERE email = ?'
    ).bind(data.email).first();
    
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }
    
    const passwordHash = hashPassword(data.password);
    
    // Insert new customer account
    const result = await c.env.DB.prepare(
      `INSERT INTO customer_accounts (full_name, email, password_hash, account_type, organization_name, status, session_version, created_at, updated_at)
       VALUES (?, ?, ?, 'business', ?, 'active', 2, datetime('now'), datetime('now'))`
    ).bind(data.fullName, data.email, passwordHash, data.organizationName).run();
    
    const customerId = result.meta.last_row_id;
    
    const token = await sign({
      sub: String(customerId),
      email: data.email,
      role: 'owner',
      type: 'customer',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      account: {
        id: customerId,
        fullName: data.fullName,
        email: data.email,
        organizationName: data.organizationName,
        accountType: 'business',
        workspaceRole: 'owner',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Customer login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);
    
    // Query customer from D1 database
    const result = await c.env.DB.prepare(
      'SELECT id, full_name, email, password_hash, account_type, organization_name, status FROM customer_accounts WHERE email = ?'
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
      'UPDATE customer_accounts SET last_login_at = ? WHERE id = ?'
    ).bind(new Date().toISOString().slice(0, 19).replace('T', ' '), result.id).run();

    const token = await sign({
      sub: String(result.id),
      email: result.email,
      role: 'owner',
      type: 'customer',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      account: {
        id: result.id,
        fullName: result.full_name,
        email: result.email,
        organizationName: result.organization_name,
        accountType: result.account_type,
        workspaceRole: 'owner',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    console.error('Customer login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    
    const customer = await c.env.DB.prepare(
      'SELECT id, full_name, email, account_type, organization_name, status FROM customer_accounts WHERE id = ?'
    ).bind(payload.sub as string).first();
    
    if (!customer) {
      return c.json({ error: 'Account not found' }, 404);
    }
    
    return c.json({ 
      account: {
        id: customer.id,
        fullName: customer.full_name,
        email: customer.email,
        organizationName: customer.organization_name,
        accountType: customer.account_type,
        workspaceRole: 'owner',
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

// Team invite - preview
app.get('/team-invites/:token', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  
  const member = await db.prepare(`
    SELECT cwm.*, ca.organization_name
    FROM customer_workspace_members cwm
    JOIN customer_accounts ca ON cwm.customer_account_id = ca.id
    WHERE cwm.activation_token = ? AND cwm.invitation_status = 'invited'
  `).bind(token).first();
  
  if (!member) {
    return c.json({ error: 'Invalid or expired invite' }, 404);
  }
  
  // Check if expired
  const expiresAt = new Date((member as any).activation_expires_at);
  if (expiresAt < new Date()) {
    return c.json({ error: 'Invite has expired' }, 410);
  }
  
  return c.json({
    fullName: (member as any).full_name,
    email: (member as any).email,
    organizationName: (member as any).organization_name,
    role: (member as any).role,
  });
});

// Team invite - accept
app.post('/team-invites/:token/accept', async (c) => {
  const db = c.env.DB;
  const token = c.req.param('token');
  const body = await c.req.json();
  
  const member = await db.prepare(`
    SELECT * FROM customer_workspace_members
    WHERE activation_token = ? AND invitation_status = 'invited'
  `).bind(token).first();
  
  if (!member) {
    return c.json({ error: 'Invalid or expired invite' }, 404);
  }
  
  // Check if expired
  const expiresAt = new Date((member as any).activation_expires_at);
  if (expiresAt < new Date()) {
    return c.json({ error: 'Invite has expired' }, 410);
  }
  
  // Hash password
  const passwordHash = hashPassword(body.password);
  
  // Activate member
  await db.prepare(`
    UPDATE customer_workspace_members
    SET password_hash = ?, invitation_status = 'active', activated_at = datetime('now'), 
        activation_token = NULL, updated_at = datetime('now')
    WHERE id = ?
  `).bind(passwordHash, (member as any).id).run();
  
  // Generate token
  const authToken = await sign({
    sub: String((member as any).id),
    email: (member as any).email,
    role: (member as any).role,
    type: 'customer',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  }, c.env.JWT_SECRET);
  
  return c.json({
    token: authToken,
    account: {
      id: (member as any).id,
      fullName: (member as any).full_name,
      email: (member as any).email,
      workspaceRole: (member as any).role,
    },
  });
});

export default app;