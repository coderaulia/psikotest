import { getDbPool } from '../database/mysql.js';
export async function createAuditEvent(input, connection) {
    const executor = (connection ?? getDbPool());
    const [result] = await executor.query(`
      INSERT INTO audit_logs (
        actor_type,
        actor_admin_id,
        entity_type,
        entity_id,
        action,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
        input.actorType,
        input.actorAdminId ?? null,
        input.entityType,
        input.entityId ?? null,
        input.action,
        input.metadata ? JSON.stringify(input.metadata) : null,
    ]);
    return result.insertId;
}
