import mysql from 'mysql2/promise';

import { env } from '../config/env.js';

export interface DbPoolLike {
  query<T = any>(sql: string, values?: unknown[]): Promise<[T, mysql.FieldPacket[]]>;
  getConnection(): Promise<mysql.PoolConnection>;
}

let pool: DbPoolLike | null = null;
let overridePool: DbPoolLike | null = null;

export function setDbPoolForTests(nextPool: DbPoolLike | null) {
  overridePool = nextPool;
}

export function getDbPool(): DbPoolLike {
  if (overridePool) {
    return overridePool;
  }

  if (!pool) {
    pool = mysql.createPool({
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      database: env.MYSQL_DATABASE,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
    }) as unknown as DbPoolLike;
  }

  return pool;
}
