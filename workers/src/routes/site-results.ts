import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Env } from '../index';

const app = new Hono<{ Bindings: Env }>();

// Helper to verify customer token
async function verifyCustomerToken(c: typeof app extends Hono<{ Bindings: Env }> ? any : never): Promise<{ id: string; email: string } | null> {
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

// List customer results
app.get('/', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  const results = await db.prepare(`
    SELECT r.id, r.submission_id, r.test_type_id, tt.code as test_type_code, tt.name as test_type_name,
           r.primary_type, r.secondary_type, r.profile_code, r.score_total, r.score_band,
           r.created_at,
           p.full_name as participant_name, p.email as participant_email,
           s.submitted_at, s.time_spent_seconds,
           ts.title as session_title
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    JOIN test_sessions ts ON s.test_session_id = ts.id
    JOIN customer_assessments ca ON ts.id = ca.test_session_id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    WHERE ca.customer_account_id = ?
    ORDER BY r.created_at DESC
    LIMIT 100
  `).bind(customer.id).all();
  
  return c.json({ items: results.results || [] });
});

// Get result detail
app.get('/:id', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare(`
    SELECT r.*, tt.code as test_type_code, tt.name as test_type_name,
           p.full_name as participant_name, p.email as participant_email, 
           p.employee_code, p.department, p.position_title,
           s.submitted_at, s.time_spent_seconds, s.identity_snapshot_json,
           ts.title as session_title
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    JOIN test_sessions ts ON s.test_session_id = ts.id
    JOIN customer_assessments ca ON ts.id = ca.test_session_id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    WHERE r.id = ? AND ca.customer_account_id = ?
  `).bind(id, customer.id).first();
  
  if (!result) {
    return c.json({ error: 'Result not found' }, 404);
  }
  
  // Get result summaries
  const summaries = await db.prepare(`
    SELECT id, metric_key, metric_label, metric_type, score, band, sort_order, summary_text, chart_payload_json
    FROM result_summaries
    WHERE result_id = ?
    ORDER BY sort_order
  `).bind(id).all();
  
  return c.json({
    ...result,
    summaries: summaries.results || [],
  });
});

// Export results to CSV
app.get('/export.csv', async (c) => {
  const customer = await verifyCustomerToken(c);
  if (!customer) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const db = c.env.DB;
  
  const results = await db.prepare(`
    SELECT r.id, r.score_total, r.score_band, r.primary_type, r.secondary_type, r.profile_code, r.created_at,
           p.full_name as participant_name, p.email as participant_email, p.employee_code, p.department,
           tt.name as test_type_name, s.submitted_at, s.time_spent_seconds,
           ts.title as session_title
    FROM results r
    JOIN submissions s ON r.submission_id = s.id
    JOIN participants p ON s.participant_id = p.id
    JOIN test_sessions ts ON s.test_session_id = ts.id
    JOIN customer_assessments ca ON ts.id = ca.test_session_id
    LEFT JOIN test_types tt ON r.test_type_id = tt.id
    WHERE ca.customer_account_id = ?
    ORDER BY r.created_at DESC
  `).bind(customer.id).all();
  
  // Generate CSV
  const headers = ['ID', 'Participant Name', 'Email', 'Employee Code', 'Department', 'Test Type', 'Session', 'Score', 'Band', 'Primary Type', 'Secondary Type', 'Profile Code', 'Submitted At', 'Time Spent (sec)'];
  const rows = (results.results || []).map((r: any) => [
    r.id,
    r.participant_name,
    r.participant_email,
    r.employee_code || '',
    r.department || '',
    r.test_type_name,
    r.session_title,
    r.score_total || '',
    r.score_band || '',
    r.primary_type || '',
    r.secondary_type || '',
    r.profile_code || '',
    r.submitted_at || '',
    r.time_spent_seconds || '',
  ]);
  
  const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(','))].join('\n');
  
  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', 'attachment; filename="results-export.csv"');
  return c.body(csv);
});

export default app;