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
  connectionLimit:    10,   // Hostinger shared allows ~10 simultaneous connections
  queueLimit:         0,
  timezone:           '+05:30',  // IST
  charset:            'utf8mb4',
  // Automatically re-connect on stale connections
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  // Required for Cloud databases like TiDB Serverless
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

// ---------------------------------------------------------------------------
// Helper: Execute a parameterized query and return typed rows.
// ---------------------------------------------------------------------------
export async function query<T = mysql.RowDataPacket>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// ---------------------------------------------------------------------------
// Helper: Execute a write query (INSERT / UPDATE / DELETE) and
// return the ResultSetHeader (insertId, affectedRows, etc.)
// ---------------------------------------------------------------------------
export async function execute(
  sql: string,
  params?: any[]
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// ---------------------------------------------------------------------------
// Test the connection on startup.
// ---------------------------------------------------------------------------
export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  conn.release();
  console.log('✅ MySQL connected successfully');
}
