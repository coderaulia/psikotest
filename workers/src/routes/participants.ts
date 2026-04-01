import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

const listQuerySchema = z.object({
  search: z.string().optional(),
});

app.use('*', requireAdmin);

app.get('/', async (c) => {
  const filters = listQuerySchema.parse(c.req.query());

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(p.full_name LIKE ? OR p.email LIKE ? OR p.employee_code LIKE ? OR p.department LIKE ?)');
    params.push(like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(
    c.env.DB,
    `SELECT
      p.id,
      p.full_name,
      p.email,
      p.employee_code,
      p.department,
      p.position_title,
      p.latest_test_type,
      p.latest_status,
      p.last_activity_at,
      COUNT(s.id) as total_submissions
    FROM participants p
    LEFT JOIN submissions s ON s.participant_id = p.id
    ${where}
    GROUP BY p.id, p.full_name, p.email, p.employee_code, p.department, p.position_title, p.latest_test_type, p.latest_status, p.last_activity_at
    ORDER BY p.last_activity_at DESC, p.id DESC
    LIMIT 100`,
    params,
  );

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.id),
      fullName: String(row.full_name ?? ''),
      email: String(row.email ?? ''),
      employeeCode: row.employee_code ? String(row.employee_code) : null,
      department: row.department ? String(row.department) : null,
      positionTitle: row.position_title ? String(row.position_title) : null,
      latestTestType: row.latest_test_type as string | null,
      latestStatus: row.latest_status as string | null,
      totalSubmissions: Number(row.total_submissions ?? 0),
      lastActivityAt: row.last_activity_at ? String(row.last_activity_at) : null,
    };
  });

  return c.json({ items });
});

export default app;