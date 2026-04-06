// DB helper functions
import type { Env } from '../types';

export interface DbContext {
  DB: D1Database;
}

export async function query(
  db: D1Database,
  sql: string,
  params?: unknown[],
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
  params?: unknown[],
): Promise<T | null> {
  const stmt = db.prepare(sql);
  const bound = params && params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.first<T>();
  return result ?? null;
}

export async function run(
  db: D1Database,
  sql: string,
  params?: unknown[],
): Promise<D1Result> {
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    return stmt.bind(...params).run();
  }
  return stmt.run();
}

/** Run multiple statements in a batch (D1 batch API) */
export async function batch(
  db: D1Database,
  statements: Array<{ sql: string; params?: unknown[] }>,
): Promise<D1Result[]> {
  const prepared = statements.map(({ sql, params }) => {
    const stmt = db.prepare(sql);
    return params && params.length > 0 ? stmt.bind(...params) : stmt;
  });
  return db.batch(prepared);
}