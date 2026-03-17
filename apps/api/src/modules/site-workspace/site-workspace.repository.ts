import { getDbPool } from '../../database/mysql.js';

export async function updateCustomerWorkspaceRecord(input: {
  customerAccountId: number;
  organizationName: string;
  settingsJson: string;
}) {
  const pool = getDbPool();
  await pool.query(
    `
      UPDATE customer_accounts
      SET organization_name = ?,
          settings_json = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [input.organizationName.trim(), input.settingsJson, input.customerAccountId],
  );
}
