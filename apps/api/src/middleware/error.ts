import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Custom error class for operational errors
export class HttpError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, HttpError);
  }
}

// Centralized error handler middleware
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const reqId = (req as Request & { id?: string }).id;
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error with request context
  logger.error({
    req: {
      id: reqId,
      method: req.method,
      url: req.url,
    },
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
      isOperational: error.isOperational,
    },
  }, `Error occurred: ${message}`);

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = {
    success: false,
    error: {
      message: statusCode >= 500 && !isDevelopment ? 'Internal Server Error' : message,
      code: statusCode,
      ...(isDevelopment && error.stack && { stack: error.stack }),
    },
    ...(reqId && { requestId: reqId }),
  };

  res.status(statusCode).json(errorResponse);
};

// Not found handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new HttpError(`Route ${req.method} ${req.originalUrl} not found`, 404);
  next(error);
};

// Async error wrapper utility
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};