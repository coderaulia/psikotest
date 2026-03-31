import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Middleware to check admin auth
app.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('jwtPayload', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

// Get dashboard summary
app.get('/', (c) => {
  return c.json({
    summaryCards: [
      { label: 'Total Sessions', value: '0', delta: '+0%' },
      { label: 'Active Participants', value: '0', delta: '+0%' },
      { label: 'Completed Tests', value: '0', delta: '+0%' },
    ],
    distributions: {
      disc: [],
      workload: [],
    },
    liveSessions: [],
    recentParticipants: [],
  });
});

export default app;