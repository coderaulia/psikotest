import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import type { Env } from '../index';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const app = new Hono<{ Bindings: Env }>();

// Admin login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);
    
    // TODO: Replace with actual database query
    // For now, using hardcoded admin (DO NOT USE IN PRODUCTION)
    if (email === 'admin@vanaila.com' && password === 'admin123') {
      const token = await sign({ 
        sub: '1', 
        email, 
        role: 'super_admin',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      }, c.env.JWT_SECRET);
      
      return c.json({
        token,
        admin: {
          id: 1,
          fullName: 'Administrator',
          email,
          role: 'super_admin',
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

// Verify token
app.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    return c.json({ admin: payload });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Logout (client-side only, just for API consistency)
app.post('/logout', (c) => {
  return c.json({ success: true });
});

export default app;