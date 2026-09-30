import mysql from 'mysql2/promise';
import { env } from './env';

// ---------------------------------------------------------------------------
// Connection pool — reused across the entire application.
// On serverless (Vercel) each function instance gets its own small pool, so
// keep the limit low to stay inside TiDB Cloud's connection quota.
// ---------------------------------------------------------------------------
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: env.isServerless ? 3 : 10,
  queueLimit: 0,
  timezone: '+05:30', // IST
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 15000,
  ...(env.db.ssl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
});

// ---------------------------------------------------------------------------
// Error codes that indicate a stale / dropped connection.
// TiDB Cloud Serverless closes idle connections after ~5 minutes.
// We detect these and retry the query once on a fresh connection.
// ---------------------------------------------------------------------------
const STALE_CONNECTION_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_SERVER_GONE_ERROR',
]);

function isStaleConnection(err: any): boolean {
  return (
    STALE_CONNECTION_CODES.has(err?.code) ||
    STALE_CONNECTION_CODES.has(err?.errno) ||
    (typeof err?.message === 'string' && (
      err.message.includes('Connection lost') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('read ECONNRESET')
    ))
  );
}

/** Parameterized SELECT → typed rows. Retries once on a dropped connection. */
export async function query<T = mysql.RowDataPacket>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (err: any) {
    if (isStaleConnection(err)) {
      console.warn('[DB] Stale connection — retrying query once…', err.code || err.message);
      const [rows] = await pool.execute(sql, params);
      return rows as T[];
    }
    throw err;
  }
}

/** INSERT / UPDATE / DELETE → ResultSetHeader. Retries once on a dropped connection. */
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  try {
    const [result] = await pool.execute(sql, params);
    return result as mysql.ResultSetHeader;
  } catch (err: any) {
    if (isStaleConnection(err)) {
      console.warn('[DB] Stale connection — retrying execute once…', err.code || err.message);
      const [result] = await pool.execute(sql, params);
      return result as mysql.ResultSetHeader;
    }
    throw err;
  }
}

/** Throws if the database cannot be reached. Used at startup. */
export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  conn.release();
  console.log('✅ MySQL connected successfully');
}

/**
 * Non-throwing connectivity probe for /api/health.
 * Returns latency in ms on success, or the error code on failure.
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const started = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err: any) {
    return { ok: false, error: err?.code || err?.message || 'unknown' };
  }
}
