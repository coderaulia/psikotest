import type { Context } from 'hono';
import type { Env } from '../types';

export function errorHandler(err: Error, c: Context<{ Bindings: Env }>) {
  console.error('Error:', err);
  
  return c.json({
    error: err.message || 'Internal Server Error',
  }, 500);
}