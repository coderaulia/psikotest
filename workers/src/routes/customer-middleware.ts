import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

export async function requireCustomer(c: typeof app extends Hono<{ Bindings: Env }> ? Hono<{ Bindings: Env }>['request'] : never, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.substring(7);
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    if (payload.type !== 'customer') {
      return c.json({ error: 'Customer access required' }, 403);
    }
    c.set('customerId', payload.sub as string);
    c.set('customerEmail', payload.email as string);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export default app;