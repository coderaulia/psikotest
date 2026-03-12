import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';

import { getDbPool } from '../database/mysql.js';

export type AuditActorType = 'admin' | 'participant' | 'system';

export interface AuditEventInput {
  actorType: AuditActorType;
  actorAdminId?: number | null;
  entityType: string;
  entityId?: number | null;
  action: string;
  metadata?: Record<string, unknown> | null;
}

export async function createAuditEvent(input: AuditEventInput, connection?: PoolConnection) {
  const executor = (connection ?? getDbPool()) as {
    query<T = any>(sql: string, values?: unknown[]): Promise<[T, unknown[]]>;
  };
  const [result] = await executor.query<ResultSetHeader>(
    `
      INSERT INTO audit_logs (
        actor_type,
        actor_admin_id,
        entity_type,
        entity_id,
        action,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      input.actorType,
      input.actorAdminId ?? null,
      input.entityType,
      input.entityId ?? null,
      input.action,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );

  return result.insertId;
}
