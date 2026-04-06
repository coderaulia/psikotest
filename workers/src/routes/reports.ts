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
  
  // Get date range (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateFrom = thirtyDaysAgo.toISOString().slice(0, 10);
  
  const [
    totalResults,
    recentResults,
    resultsByType,
    averageScores,
    topProfiles,
    submissionsByDay
  ] = await Promise.all([
    // Total results count
    db.prepare('SELECT COUNT(*) as count FROM results').first(),
    
    // Results in last 30 days
    db.prepare('SELECT COUNT(*) as count FROM results WHERE created_at >= ?').bind(dateFrom).first(),
    
    // Results by test type
    db.prepare(`
      SELECT tt.code, tt.name, COUNT(*) as count 
      FROM results r
      JOIN test_types tt ON r.test_type_id = tt.id
      GROUP BY tt.id
    `).all(),
    
    // Average scores by type
    db.prepare(`
      SELECT tt.code, tt.name, AVG(r.score_total) as avg_score
      FROM results r
      JOIN test_types tt ON r.test_type_id = tt.id
      WHERE r.score_total IS NOT NULL
      GROUP BY tt.id
    `).all(),
    
    // Top profile codes
    db.prepare(`
      SELECT profile_code, COUNT(*) as count
      FROM results
      WHERE profile_code IS NOT NULL AND profile_code != ''
      GROUP BY profile_code
      ORDER BY count DESC
      LIMIT 10
    `).all(),
    
    // Submissions by day (last 30 days)
    db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count
      FROM submissions
      WHERE created_at >= ?
      GROUP BY date(created_at)
      ORDER BY date
    `).bind(dateFrom).all()
  ]);
  
  return c.json({
    summary: {
      totalResults: (totalResults as any)?.count || 0,
      recentResults: (recentResults as any)?.count || 0,
      periodDays: 30,
    },
    resultsByType: (resultsByType as any).results || [],
    averageScores: (averageScores as any).results || [],
    topProfiles: (topProfiles as any).results || [],
    submissionsByDay: (submissionsByDay as any).results || [],
  });
});

export default app;