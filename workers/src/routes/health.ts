import { Hono } from 'hono';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;