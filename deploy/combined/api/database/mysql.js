import mysql from 'mysql2/promise';
import { env } from '../config/env.js';
let pool = null;
let overridePool = null;
export function setDbPoolForTests(nextPool) {
    overridePool = nextPool;
}
export function getDbPool() {
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
        });
    }
    return pool;
}
