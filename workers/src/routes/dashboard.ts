import { Hono } from 'hono';
import type { Env } from '../index';
import { verifyAdminToken } from './admin-middleware';

const app = new Hono<{ Bindings: Env }>();

app.get('/summary', async (c) => {
  const admin = await verifyAdminToken(c);
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const [sessionsResult, participantsResult, submissionsResult] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM test_sessions WHERE status = ?').bind('active').first(),
    db.prepare('SELECT COUNT(*) as count FROM participants').first(),
    db.prepare('SELECT COUNT(*) as count FROM submissions WHERE status = ?').bind('completed').first(),
  ]);

  return c.json({
    summaryCards: [
      { label: 'Active Sessions', value: String((sessionsResult as any)?.count || 0), delta: '+0%' },
      { label: 'Total Participants', value: String((participantsResult as any)?.count || 0), delta: '+0%' },
      { label: 'Completed Tests', value: String((submissionsResult as any)?.count || 0), delta: '+0%' },
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