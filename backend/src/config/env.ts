import dotenv from 'dotenv';

// Load .env once, before anything else reads process.env.
// On Vercel / Hostinger the variables come from the platform, so a missing
// .env file is normal there.
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Central, typed view of every environment variable the API uses.
 * Reading process.env in one place makes it obvious what production needs
 * and lets /api/health report which pieces are missing without leaking values.
 */
export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isServerless: process.env.VERCEL === '1',
  port: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'sasta_room',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // TiDB Cloud / most managed MySQL require TLS. Local MariaDB usually has
    // no TLS, so DB_SSL=false turns it off for development.
    ssl: (process.env.DB_SSL ?? 'true').toLowerCase() !== 'false',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Origins allowed to call the API from a browser.
  corsOrigins: [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4200',
    process.env.FRONTEND_URL,
    process.env.PROD_FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()),
  ].filter((o): o is string => !!o),

  // Optional outbound email. When SMTP_HOST is empty, notifications are skipped.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@sastaroom.local',
  },

  // Where lead notifications (new booking request, contact form) are sent.
  notifyEmail: process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',

  // Used by the migration to create / update the admin login.
  admin: {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  },

  // Maximum bytes accepted for a single uploaded image (before server-side resize).
  maxUploadBytes: Number(process.env.MAX_FILE_SIZE) || 8 * 1024 * 1024,
};

/**
 * Names of required settings that are missing. Empty array means the API is
 * fully configured. Exposed through /api/health so a broken deploy is visible
 * in one request instead of failing silently on the first login.
 */
export function missingConfig(): string[] {
  const missing: string[] = [];
  if (!env.jwt.secret) missing.push('JWT_SECRET');
  if (!process.env.DB_HOST) missing.push('DB_HOST');
  if (!process.env.DB_USER) missing.push('DB_USER');
  if (!process.env.DB_PASSWORD) missing.push('DB_PASSWORD');
  return missing;
}

const missing = missingConfig();
if (missing.length > 0) {
  const msg = `Missing environment variables: ${missing.join(', ')}`;
  if (env.isProduction) {
    console.error(`[config] ${msg}. Logins and database calls will fail until these are set.`);
  } else {
    console.warn(`[config] ${msg}`);
  }
}
