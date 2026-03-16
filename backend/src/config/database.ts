import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Connection pool — reused across the entire application.
// mysql2/promise gives us async/await support out of the box.
// ---------------------------------------------------------------------------
export const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  database:           process.env.DB_NAME     || 'sasta_room',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30',  // IST
  charset:            'utf8mb4',
  // Keep connections alive to reduce TiDB Cloud idle drops
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  // Required for Cloud databases like TiDB Serverless
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
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

// ---------------------------------------------------------------------------
// Helper: Parameterized SELECT query → typed rows.
// Retries once on stale / dropped-connection errors from TiDB Cloud.
// ---------------------------------------------------------------------------
export async function query<T = mysql.RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T[]> {
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

// ---------------------------------------------------------------------------
// Helper: Write query (INSERT / UPDATE / DELETE) → ResultSetHeader.
// Retries once on stale / dropped-connection errors from TiDB Cloud.
// ---------------------------------------------------------------------------
export async function execute(
  sql: string,
  params?: any[]
): Promise<mysql.ResultSetHeader> {
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

// ---------------------------------------------------------------------------
// Test the connection on startup.
// ---------------------------------------------------------------------------
export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  conn.release();
  console.log('✅ MySQL connected successfully');
}
