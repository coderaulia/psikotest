import type { Context } from 'hono';
import type { Env } from '../index';

export interface DbContext {
  DB: D1Database;
}

// Helper to execute SQL with parameters
export async function query(
  db: D1Database,
  sql: string,
  params?: unknown[]
): Promise<D1Result<unknown>> {
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    return stmt.bind(...params).all();
  }
  return stmt.all();
}

// Helper for single row queries
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query(db, sql, params);
  return (result.results?.[0] as T) || null;
}

// Helper for insert/update/delete
export async function execute(
  db: D1Database,
  sql: string,
  params?: unknown[]
): Promise<D1Result> {
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    return stmt.bind(...params).run();
  }
  return stmt.run();
}

// Helper to get last inserted ID
export async function insertAndGetId(
  db: D1Database,
  sql: string,
  params?: unknown[]
): Promise<number> {
  const result = await execute(db, sql, params);
  return result.meta?.last_row_id || 0;
}