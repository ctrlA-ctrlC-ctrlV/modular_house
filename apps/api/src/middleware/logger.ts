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
 * The `referrer` entries (Phase 2, plan §2.3 M7 / §2.4 S5 / §2.7 R2) close a
 * PII vector specific to the analytics ingest pipeline: the beacon payload's
 * `referrer` field is `document.referrer` — a full URL that may carry query
 * strings with search terms or ad click IDs. The ingest service stores only
 * the hostname (S5), but the `validateBody` middleware logs `body: req.body`
 * verbatim on a validation failure (400), which would otherwise write the
 * full referrer URL to the log stream. The `body.referrer` path redacts it at
 * the logger level; the top-level `referrer` path covers any direct logger
 * call that accidentally includes the field.
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
  // Top-level referrer — the analytics beacon payload's `referrer` field is
  // a full URL that may carry query-string PII (search terms, ad click IDs).
  // Redacted at the top level for any direct logger call (M7/R2/S5).
  'referrer',
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
  // Nested referrer under `body` — the analytics ingest route's
  // `validateBody(ingestEventSchema)` logs `body: req.body` on a 400, and the
  // body contains the raw `referrer` URL. This path redacts it so the full
  // referrer URL never reaches the log stream (M7/R2/S5).
  'body.referrer',
] as const;

// Create base logger. The `redact` option ensures secrets (passwords, OTP
// codes, reset tokens, referrer URLs) never reach the log output regardless
// of how they are
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