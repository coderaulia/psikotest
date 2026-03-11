import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

interface CountRow extends RowDataPacket {
  value: number | null;
}

interface DistributionRow extends RowDataPacket {
  label: string | null;
  value: number;
}

export interface DashboardMetrics {
  activeSessions: number;
  draftSessions: number;
  participantCount: number;
  totalSubmissions: number;
  completedSubmissions: number;
  averageIqScore: number | null;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const pool = getDbPool();

  const [[activeSessionRows], [participantRows], [submissionRows], [averageIqRows]] = await Promise.all([
    pool.query<CountRow[]>("SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'active'"),
    pool.query<CountRow[]>('SELECT COUNT(*) AS value FROM participants'),
    pool.query<CountRow[]>(
      `
        SELECT
          COUNT(*) AS value,
          SUM(CASE WHEN status IN ('submitted', 'scored') THEN 1 ELSE 0 END) AS completed_value
        FROM submissions
      `,
    ),
    pool.query<CountRow[]>(
      `
        SELECT ROUND(AVG(r.score_total), 0) AS value
        FROM results r
        INNER JOIN test_types tt ON tt.id = r.test_type_id
        WHERE tt.code = 'iq'
      `,
    ),
  ]);

  const [draftRows] = await pool.query<CountRow[]>("SELECT COUNT(*) AS value FROM test_sessions WHERE status = 'draft'");
  const completedSubmissions = Number((submissionRows[0] as RowDataPacket | undefined)?.completed_value ?? 0);

  return {
    activeSessions: Number(activeSessionRows[0]?.value ?? 0),
    draftSessions: Number(draftRows[0]?.value ?? 0),
    participantCount: Number(participantRows[0]?.value ?? 0),
    totalSubmissions: Number(submissionRows[0]?.value ?? 0),
    completedSubmissions,
    averageIqScore: averageIqRows[0]?.value == null ? null : Number(averageIqRows[0].value),
  };
}

export async function fetchDiscDistribution() {
  const pool = getDbPool();
  const [rows] = await pool.query<DistributionRow[]>(
    `
      SELECT COALESCE(r.primary_type, 'Unknown') AS label, COUNT(*) AS value
      FROM results r
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      WHERE tt.code = 'disc'
      GROUP BY COALESCE(r.primary_type, 'Unknown')
      ORDER BY FIELD(COALESCE(r.primary_type, 'Unknown'), 'D', 'I', 'S', 'C', 'Unknown')
    `,
  );

  return rows.map((row) => ({ label: row.label ?? 'Unknown', value: Number(row.value ?? 0) }));
}

export async function fetchWorkloadDistribution() {
  const pool = getDbPool();
  const [rows] = await pool.query<DistributionRow[]>(
    `
      SELECT
        CASE r.score_band
          WHEN 'low_workload' THEN 'Low'
          WHEN 'moderate_workload' THEN 'Moderate'
          WHEN 'high_workload' THEN 'High'
          ELSE COALESCE(r.score_band, 'Unknown')
        END AS label,
        COUNT(*) AS value
      FROM results r
      INNER JOIN test_types tt ON tt.id = r.test_type_id
      WHERE tt.code = 'workload'
      GROUP BY label
      ORDER BY FIELD(label, 'Low', 'Moderate', 'High', 'Unknown')
    `,
  );

  return rows.map((row) => ({ label: row.label ?? 'Unknown', value: Number(row.value ?? 0) }));
}
