import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
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

// Customer signup
app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    
    // TODO: Create customer account in D1 database
    // This is a placeholder implementation
    
    const token = await sign({
      sub: 'customer-1',
      email: data.email,
      role: 'owner',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }, c.env.JWT_SECRET);
    
    return c.json({
      token,
      account: {
        id: 1,
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
    throw error;
  }
});

// Customer login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);
    
    // TODO: Replace with actual database query
    if (email === 'customer@example.com' && password === 'password') {
      const token = await sign({
        sub: 'customer-1',
        email,
        role: 'owner',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      }, c.env.JWT_SECRET);
      
      return c.json({
        token,
        account: {
          id: 1,
          fullName: 'Customer User',
          email,
          organizationName: 'Example Corp',
          accountType: 'business',
          workspaceRole: 'owner',
        },
      });
    }
    
    return c.json({ error: 'Invalid credentials' }, 401);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: error.errors[0].message }, 400);
    }
    throw error;
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
    const payload = await verify(token, c.env.JWT_SECRET);
    return c.json({ account: payload });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Logout
app.post('/logout', (c) => {
  return c.json({ success: true });
});

export default app;