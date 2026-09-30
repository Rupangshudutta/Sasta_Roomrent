import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Global error handler — must be last middleware registered in app.ts.
 * Catches all errors thrown or passed via next(err).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'An internal server error occurred';

  // Translate common infrastructure errors into actionable messages.
  if (err.code === 'LIMIT_FILE_SIZE') { statusCode = 413; message = 'Image is too large'; }
  else if (err.code === 'LIMIT_FILE_COUNT') { statusCode = 400; message = 'Too many images (max 10)'; }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') { statusCode = 400; message = 'Unexpected upload field'; }
  else if (err.message?.startsWith('Only JPEG')) { statusCode = 400; message = err.message; }
  else if (err.message?.includes('not allowed by CORS')) { statusCode = 403; message = err.message; }
  else if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(err.code || '')) {
    statusCode = 503; message = 'Database is unavailable. Please try again shortly.';
  }

  const isDev = !env.isProduction;
  console.error(`[ERROR ${statusCode}] ${err.message}`, isDev ? err.stack : '');

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
}

/** Helper to create operational errors */
export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
