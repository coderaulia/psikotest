import { Hono } from 'hono';
import { query, queryOne } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

app.use('*', requireAdmin);

// GET /api/dashboard/summary
app.get('/summary', async (c) => {
  const db = c.env.DB;

  // Run metrics queries in parallel
  const [activeSessionResult, draftSessionResult, participantResult, submissionResult] = await Promise.all([
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'active'"),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'draft'"),
    queryOne<{ value: number }>(db, 'SELECT COUNT(*) AS value FROM participants'),
    queryOne<{ total: number; completed: number }>(
      db,
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status IN ('submitted', 'scored') THEN 1 ELSE 0 END) AS completed
       FROM submissions`,
    ),
  ]);

  const activeSessions = Number(activeSessionResult?.value ?? 0);
  const draftSessions = Number(draftSessionResult?.value ?? 0);
  const participantCount = Number(participantResult?.value ?? 0);
  const totalSubmissions = Number(submissionResult?.total ?? 0);
  const completedSubmissions = Number(submissionResult?.completed ?? 0);

  // Average IQ score
  const iqAvg = await queryOne<{ value: number | null }>(
    db,
    `SELECT ROUND(AVG(r.score_total), 0) AS value
     FROM results r
     WHERE r.test_type = 'iq'`,
  );
  const averageIqScore = iqAvg?.value != null ? Number(iqAvg.value) : null;

  const completionRate = totalSubmissions > 0
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  return c.json({
    activeSessions,
    draftSessions,
    participantCount,
    totalSubmissions,
    completedSubmissions,
    averageIqScore,
    completionRate,
  });
});

// GET /api/dashboard
app.get('/', async (c) => {
  const db = c.env.DB;

  // Run metrics queries in parallel
  const [activeSessionResult, draftSessionResult, participantResult, submissionResult] = await Promise.all([
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'active'"),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'draft'"),
    queryOne<{ value: number }>(db, 'SELECT COUNT(*) AS value FROM participants'),
    queryOne<{ total: number; completed: number }>(
      db,
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status IN ('submitted', 'scored') THEN 1 ELSE 0 END) AS completed
       FROM submissions`,
    ),
  ]);

  const activeSessions = Number(activeSessionResult?.value ?? 0);
  const draftSessions = Number(draftSessionResult?.value ?? 0);
  const participantCount = Number(participantResult?.value ?? 0);
  const totalSubmissions = Number(submissionResult?.total ?? 0);
  const completedSubmissions = Number(submissionResult?.completed ?? 0);

  // Average IQ score
  const iqAvg = await queryOne<{ value: number | null }>(
    db,
    `SELECT ROUND(AVG(r.score_total), 0) AS value
     FROM results r
     WHERE r.test_type = 'iq'`,
  );
  const averageIqScore = iqAvg?.value != null ? Number(iqAvg.value) : null;

  // DISC distribution
  const discRows = await query(
    db,
    `SELECT COALESCE(primary_type, 'Unknown') AS label, COUNT(*) AS value
     FROM results
     WHERE test_type = 'disc'
     GROUP BY COALESCE(primary_type, 'Unknown')
     ORDER BY label`,
  );

  // Workload distribution
  const workloadRows = await query(
    db,
    `SELECT
       CASE score_band
         WHEN 'low_workload' THEN 'Low'
         WHEN 'moderate_workload' THEN 'Moderate'
         WHEN 'high_workload' THEN 'High'
         ELSE COALESCE(score_band, 'Unknown')
       END AS label,
       COUNT(*) AS value
     FROM results
     WHERE test_type = 'workload'
     GROUP BY label`,
  );

  // Live (active) sessions with latest activity
  const liveSessionRows = await query(
    db,
    `SELECT
       ts.id,
       ts.title,
       ts.test_type,
       ts.access_token,
       COUNT(DISTINCT s.participant_id) AS participant_count,
       COUNT(DISTINCT CASE WHEN s.status IN ('submitted','scored') THEN s.participant_id END) AS completed_count
     FROM test_sessions ts
     LEFT JOIN submissions s ON s.session_id = ts.id
     WHERE ts.status = 'active'
     GROUP BY ts.id, ts.title, ts.test_type, ts.access_token
     ORDER BY ts.updated_at DESC
     LIMIT 5`,
  );

  // Recent participants
  const recentRows = await query(
    db,
    `SELECT p.id, p.full_name, p.email, p.latest_test_type, p.latest_status, p.last_activity_at
     FROM participants p
     ORDER BY p.last_activity_at DESC
     LIMIT 10`,
  );

  const completionRate = totalSubmissions > 0
    ? Math.round((completedSubmissions / totalSubmissions) * 100)
    : 0;

  return c.json({
    summaryCards: [
      { label: 'Active Sessions', value: String(activeSessions), sublabel: `${draftSessions} draft` },
      { label: 'Participants', value: String(participantCount), sublabel: null },
      { label: 'Completed Tests', value: String(completedSubmissions), sublabel: `${completionRate}% completion rate` },
      { label: 'Avg IQ Score', value: averageIqScore != null ? String(averageIqScore) : '—', sublabel: null },
    ],
    metrics: {
      activeSessions,
      draftSessions,
      participantCount,
      totalSubmissions,
      completedSubmissions,
      averageIqScore,
    },
    distributions: {
      disc: (discRows.results ?? []).map((r) => ({
        label: (r as Record<string, unknown>).label as string,
        value: Number((r as Record<string, unknown>).value),
      })),
      workload: (workloadRows.results ?? []).map((r) => ({
        label: (r as Record<string, unknown>).label as string,
        value: Number((r as Record<string, unknown>).value),
      })),
    },
    liveSessions: (liveSessionRows.results ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        title: row.title,
        testType: row.test_type,
        accessToken: row.access_token,
        participantCount: Number(row.participant_count),
        completedCount: Number(row.completed_count),
      };
    }),
    recentParticipants: (recentRows.results ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        latestTestType: row.latest_test_type,
        latestStatus: row.latest_status,
        lastActivityAt: row.last_activity_at,
      };
    }),
  });
});

export default app;