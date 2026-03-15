import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler — must be last middleware registered in app.ts.
 * Catches all errors thrown or passed via next(err).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : '');

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'An internal server error occurred',
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
