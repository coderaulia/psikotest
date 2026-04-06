import { Hono } from 'hono';
import { query, queryOne } from '../lib/db';
import { requireAdmin } from '../middleware/auth';
import type { AdminJwtPayload, Env } from '../types';

const app = new Hono<{ Bindings: Env; Variables: { adminPayload: AdminJwtPayload } }>();

type ResultReviewStatus = 'scored_preliminary' | 'in_review' | 'reviewed' | 'released';

function normalizeReviewStatus(rawStatus: string | null, releasedAt: string | null): ResultReviewStatus {
  if (releasedAt) return 'released';
  if (rawStatus === 'released') return 'released';
  if (rawStatus === 'reviewed') return 'reviewed';
  if (rawStatus === 'in_review') return 'in_review';
  return 'scored_preliminary';
}

function formatDistributionLabel(status: ResultReviewStatus): string {
  switch (status) {
    case 'released': return 'Released';
    case 'reviewed': return 'Reviewed';
    case 'in_review': return 'In Review';
    default: return 'Preliminary';
  }
}

app.use('*', requireAdmin);

app.get('/summary', async (c) => {
  const db = c.env.DB;

  const [countResult, participantCount, sessionCount] = await Promise.all([
    queryOne<{ value: number }>(db, 'SELECT COUNT(*) AS value FROM results'),
    queryOne<{ value: number }>(db, 'SELECT COUNT(*) AS value FROM participants'),
    queryOne<{ value: number }>(db, "SELECT COUNT(*) AS value FROM test_sessions WHERE status IN ('active', 'completed')"),
  ]);

  const scoredResults = Number(countResult?.value ?? 0);
  const participants = Number(participantCount?.value ?? 0);
  const reportableSessions = Number(sessionCount?.value ?? 0);

  const averagesRows = await query(
    db,
    `SELECT
      test_type,
      ROUND(AVG(score_total), 2) AS average_score,
      COUNT(*) AS submission_count
    FROM results
    WHERE score_total IS NOT NULL
    GROUP BY test_type
    ORDER BY test_type`,
    [],
  );

  const averagesByTestType = (averagesRows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      testType: row.test_type as string,
      averageScore: row.average_score != null ? Number(row.average_score) : null,
      submissionCount: Number(row.submission_count ?? 0),
    };
  });

  const discRows = await query(
    db,
    `SELECT COALESCE(primary_type, 'Unknown') AS label, COUNT(*) AS value
    FROM results
    WHERE test_type = 'disc'
    GROUP BY COALESCE(primary_type, 'Unknown')
    ORDER BY label`,
  );

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

  const reviewRows = await query(
    db,
    `SELECT
      COALESCE(review_status, 'scored_preliminary') AS review_status,
      released_at,
      COUNT(*) AS value
    FROM results
    GROUP BY review_status, released_at`,
  );

  const reviewStatusDistribution: { label: string; value: number }[] = [];
  const statusCounts = new Map<ResultReviewStatus, number>();
  
  for (const r of reviewRows.results ?? []) {
    const row = r as Record<string, unknown>;
    const rawStatus = row.review_status as string | null;
    const releasedAt = row.released_at as string | null;
    const count = Number(row.value ?? 0);
    const normalized = normalizeReviewStatus(rawStatus, releasedAt);
    statusCounts.set(normalized, (statusCounts.get(normalized) ?? 0) + count);
  }

  for (const [status, count] of statusCounts) {
    reviewStatusDistribution.push({
      label: formatDistributionLabel(status),
      value: count,
    });
  }

  const recentRows = await query(
    db,
    `SELECT
      r.id AS result_id,
      p.full_name AS participant_name,
      ts.title AS session_title,
      r.test_type,
      COALESCE(s.submitted_at, r.created_at) AS submitted_at,
      r.score_band,
      r.profile_code,
      r.review_status,
      r.released_at
    FROM results r
    INNER JOIN submissions s ON s.id = r.submission_id
    INNER JOIN participants p ON p.id = s.participant_id
    INNER JOIN test_sessions ts ON ts.id = s.session_id
    ORDER BY COALESCE(s.submitted_at, r.created_at) DESC, r.id DESC
    LIMIT 8`,
  );

  const recentCompletions = (recentRows.results ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: Number(row.result_id),
      participantName: String(row.participant_name ?? 'Unknown'),
      sessionTitle: String(row.session_title ?? 'Unknown'),
      testType: row.test_type as string,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      summary: String(row.profile_code ?? row.score_band ?? 'Scored assessment'),
      reviewStatus: normalizeReviewStatus(row.review_status as string | null, row.released_at as string | null),
    };
  });

  const reviewCount = statusCounts.get('reviewed') ?? 0;

  return c.json({
    summaryCards: [
      { label: 'Scored Results', value: String(scoredResults), delta: 'Stored result records' },
      { label: 'Participants', value: String(participants), delta: 'Unique participant profiles' },
      { label: 'Reportable Sessions', value: String(reportableSessions), delta: 'Active or completed sessions' },
      { label: 'Reviewed Results', value: String(reviewCount), delta: 'Professionally reviewed outcomes' },
    ],
    averagesByTestType,
    distributions: {
      disc: (discRows.results ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return { label: String(row.label), value: Number(row.value) };
      }),
      workload: (workloadRows.results ?? []).map((r) => {
        const row = r as Record<string, unknown>;
        return { label: String(row.label), value: Number(row.value) };
      }),
      reviewStatus: reviewStatusDistribution,
    },
    recentCompletions,
  });
});

export default app;