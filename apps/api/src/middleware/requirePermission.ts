import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

/**
 * RBAC permission middleware factory (FR-036, research R5).
 *
 * Returns an Express middleware that allows the request through only when the
 * authenticated user's effective permission set (loaded into `req.user.permissions`
 * by `authenticateJWT`) contains the requested `resource:action` pair.
 *
 * Open-Closed: adding a new role/permission never requires editing route code —
 * just pass different (resource, action) arguments.
 *
 * @param resource  The resource name (e.g. "submissions", "settings").
 * @param action    The action name (e.g. "read", "export", "write").
 *
 * @returns A middleware function that next()s on allow, or responds with
 *          401 (unauthenticated) or 403 (forbidden).
 */
export function requirePermission(resource: string, action: string) {
  const required = `${resource}:${action}`;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.permissions.includes(required)) {
      next();
      return;
    }

    logger.warn(
      { userId: req.user.userId, required, permissions: req.user.permissions },
      'Permission denied',
    );

    res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  };
}
