import type { RowDataPacket } from 'mysql2/promise';

import { getDbPool } from '../../database/mysql.js';

export interface CustomerListItem {
  id: number;
  fullName: string;
  email: string;
  accountType: 'business' | 'researcher';
  organizationName: string;
  status: 'active' | 'inactive';
  lastLoginAt: string | null;
  createdAt: string | null;
  assessmentCount: number;
}

interface CustomerRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  account_type: 'business' | 'researcher';
  organization_name: string;
  status: 'active' | 'inactive';
  last_login_at: string | Date | null;
  created_at: string | Date | null;
  assessment_count: number;
}

function toIsoString(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: CustomerRow): CustomerListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    accountType: row.account_type,
    organizationName: row.organization_name,
    status: row.status,
    lastLoginAt: toIsoString(row.last_login_at),
    createdAt: toIsoString(row.created_at),
    assessmentCount: Number(row.assessment_count ?? 0),
  };
}

export async function fetchAllCustomers(filters: {
  search?: string;
  status?: 'active' | 'inactive';
  accountType?: 'business' | 'researcher';
} = {}): Promise<CustomerListItem[]> {
  const pool = getDbPool();
  const conditions: string[] = [];
  const params: string[] = [];

  const search = filters.search?.trim();
  if (search) {
    const like = `%${search}%`;
    conditions.push('(ca.full_name LIKE ? OR ca.email LIKE ? OR ca.organization_name LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.status) {
    conditions.push('ca.status = ?');
    params.push(filters.status);
  }

  if (filters.accountType) {
    conditions.push('ca.account_type = ?');
    params.push(filters.accountType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query<CustomerRow[]>(
    `
      SELECT
        ca.id,
        ca.full_name,
        ca.email,
        ca.account_type,
        ca.organization_name,
        ca.status,
        ca.last_login_at,
        ca.created_at,
        COUNT(cass.id) AS assessment_count
      FROM customer_accounts ca
      LEFT JOIN customer_assessments cass ON cass.customer_account_id = ca.id
      ${whereClause}
      GROUP BY ca.id
      ORDER BY ca.created_at DESC, ca.id DESC
      LIMIT 200
    `,
    params,
  );

  return rows.map(mapRow);
}

export async function setCustomerStatus(id: number, status: 'active' | 'inactive') {
  const pool = getDbPool();
  await pool.query(
    'UPDATE customer_accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
  );
}
