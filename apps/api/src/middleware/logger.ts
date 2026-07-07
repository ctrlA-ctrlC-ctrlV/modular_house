import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

/**
 * Secret field paths that Pino redacts from every log line (FR-039, I3).
 *
 * The redaction operates at the serialization layer: before Pino writes a log
 * line, it walks the redact paths and replaces each matching value with the
 * censor string `[Redacted]`. This is defense in depth — even if a future
 * change accidentally passes a secret to the logger, the value never reaches
 * the output stream (stdout in production, the capture stream in tests).
 *
 * Two nesting levels are covered:
 *
 *   1. Top-level keys — any direct `logger.info({ password: ... })` call.
 *   2. `body.*` paths — the body-validation middleware (`validate.ts`) logs
 *      `body: req.body` verbatim when Zod validation fails, so a malformed
 *      login / reset / change request would otherwise write the raw password,
 *      OTP code, or reset token to the log stream. These paths close that
 *      vector at the logger level rather than relying on every caller to
 *      remember to scrub the body.
 *
 * The array is exported so the redaction test (T102) can build a mock logger
 * with the exact same paths via `importOriginal`, tying the test to the
 * production configuration rather than a parallel copy that could drift.
 * Additive only — new secret field names can be appended without touching
 * existing entries (Open-Closed).
 */
export const REDACT_PATHS = [
  // Top-level credential fields — direct logger calls that accidentally
  // include one of these keys have the value replaced with [Redacted].
  'password',
  'newPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'code',
  'otp',
  'refreshToken',
  // Nested under `body` — the validate middleware logs `body: req.body` on
  // validation failure, so request-body secrets must be redacted at this path.
  'body.password',
  'body.newPassword',
  'body.currentPassword',
  'body.confirmPassword',
  'body.token',
  'body.code',
  'body.otp',
  'body.refreshToken',
] as const;

// Create base logger. The `redact` option ensures secrets (passwords, OTP
// codes, reset tokens) never reach the log output regardless of how they are
// passed to a logger call (FR-039, I3).
export const logger = pino({
  level: config.app.logLevel,
  redact: {
    paths: [...REDACT_PATHS],
    censor: '[Redacted]',
  },
  transport: config.app.nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Simple HTTP logger middleware with request ID
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const reqId = uuidv4();
  
  // Add request ID to request object
  (req as Request & { id: string }).id = reqId;
  
  // Log incoming request
  logger.info({
    req: {
      id: reqId,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.socket?.remoteAddress,
      remotePort: req.socket?.remotePort,
    },
  }, 'incoming request');
  
  // Log response when finished
  res.on('finish', () => {
    const latency_ms = Date.now() - startTime;
    
    const logLevel = res.statusCode >= 500 ? 'error' : 
                    res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]({
      req: { id: reqId, method: req.method, url: req.url },
      res: {
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeader('content-type'),
          'content-length': res.getHeader('content-length'),
        },
      },
      latency_ms,
    }, `${req.method} ${res.statusCode >= 400 ? 'errored' : 'completed'}`);
  });
  
  next();
};