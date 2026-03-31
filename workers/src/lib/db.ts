// DB helper functions
import type { Env } from '../types';

export interface DbContext {
  DB: D1Database;
}

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

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query(db, sql, params);
  return (result.results?.[0] as T) || null;
}