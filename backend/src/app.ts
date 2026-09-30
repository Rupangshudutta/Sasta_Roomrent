import { env, missingConfig } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { testConnection, pingDatabase } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import bookingRoutes from './routes/booking.routes';
import reviewRoutes from './routes/review.routes';
import dashboardRoutes from './routes/dashboard.routes';
import inquiryRoutes from './routes/inquiry.routes';
import contactRoutes from './routes/contact.routes';
import helpRoutes from './routes/help.routes';
import imageRoutes from './routes/image.routes';

const app = express();

// Behind Vercel / Hostinger / any reverse proxy the client IP arrives in
// X-Forwarded-For. Without this, every visitor shares the proxy's IP and the
// rate limiter would block the whole site after 100 requests.
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Security & utility middleware
// ---------------------------------------------------------------------------
app.use(helmet({
  // Photos are embedded by the Angular app, which may live on another origin.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

// CORS: allow-listed origins get the Access-Control-* headers. Any other
// origin gets no headers, which the *browser* then blocks for cross-origin
// calls. We never reject the request server-side: browsers also send an
// Origin header on same-origin POSTs (e.g. the Angular app on the same
// domain calling /api/auth/login), and those must always succeed.
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.corsOrigins.includes(origin)),
    credentials: true,
  })
);

// General limit: generous enough for a SPA that makes several calls per page.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/images') || req.path === '/api/health',
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);

// Tighter limit on credential endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please wait 15 minutes' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Legacy: photos uploaded by older builds to a local ./uploads folder.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/inquiries',  inquiryRoutes);
app.use('/api/contact',    contactRoutes);
app.use('/api/help',       helpRoutes);
app.use('/api/images',     imageRoutes);

// Health check — also reports DB reachability and missing config so a bad
// deploy is diagnosable from a single URL. Values are never included.
app.get('/api/health', async (_req, res) => {
  const db = await pingDatabase();
  const missing = missingConfig();
  const healthy = db.ok && missing.length === 0;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'Sasta Room API is running' : 'Sasta Room API is degraded',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    environment: env.nodeEnv,
    serverless: env.isServerless,
    db,
    missingConfig: missing,
    emailEnabled: !!env.smtp.host,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// ---------------------------------------------------------------------------
// Connect & Start (only when running as a normal Node process; on Vercel the
// exported app is wrapped by api/index.js instead)
// ---------------------------------------------------------------------------
if (!env.isServerless) {
  (async () => {
    try {
      await testConnection();
    } catch (error) {
      console.error('\n❌ DATABASE CONNECTION FAILED!');
      console.error('Check DB_HOST / DB_USER / DB_PASSWORD / DB_SSL in your environment.');
      console.error('The server will still run, but API calls will fail until the database is connected.\n');
    }
    app.listen(env.port, '0.0.0.0', () => {
      console.log(`🚀 Sasta Room API running on http://localhost:${env.port}`);
      console.log(`📊 Environment: ${env.nodeEnv}`);
    });
  })();
}

export default app;
