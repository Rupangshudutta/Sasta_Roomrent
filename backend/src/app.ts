import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { testConnection } from './config/database';
import { errorMiddleware } from './middleware/error.middleware';

// Route imports
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import bookingRoutes from './routes/booking.routes';
import reviewRoutes from './routes/review.routes';
import dashboardRoutes from './routes/dashboard.routes';
import inquiryRoutes from './routes/inquiry.routes';
import contactRoutes from './routes/contact.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Security & utility middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — allow Angular dev server and production domain
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL,
  process.env.PROD_FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// Rate limiting — 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth',      authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/contact',   contactRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Sasta Room API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorMiddleware);

// ---------------------------------------------------------------------------
// Connect & Start (Only if not on Vercel Serverless)
// ---------------------------------------------------------------------------
if (process.env.VERCEL !== '1') {
  (async () => {
    try {
      await testConnection();
    } catch (error) {
      console.error('\n❌ DATABASE CONNECTION FAILED!');
      console.error('Make sure you have created your .env file and added your TiDB Cloud credentials.');
      console.error('The server will still run, but API calls will fail until the database is connected.\n');
    }
    app.listen(PORT, () => {
      console.log(`🚀 Sasta Room API running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })();
}

export default app;
