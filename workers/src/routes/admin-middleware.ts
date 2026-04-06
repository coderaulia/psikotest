import { Context } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../index';

export async function verifyAdminToken(c: Context<{ Bindings: Env }>): Promise<{ id: string; email: string; role: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.type !== 'admin') {
      return null;
    }
    return {
      id: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function verifyCustomerToken(c: Context<{ Bindings: Env }>): Promise<{ id: string; email: string } | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.type !== 'customer') {
      return null;
    }
    return {
      id: payload.sub as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}