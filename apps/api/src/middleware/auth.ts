import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.js';
import { logger } from './logger.js';

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roles: string[];
      };
    }
  }
}

const authService = new AuthService();

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (decoded) {
      req.user = decoded;
      next();
    } else {
      logger.warn({ ip: req.ip }, 'Invalid or expired token provided');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } else {
    logger.debug({ ip: req.ip }, 'No token provided for protected route');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user && req.user.roles.includes(role)) {
      next();
    } else {
      logger.warn({ 
        userId: req.user?.userId, 
        requiredRole: role, 
        userRoles: req.user?.roles 
      }, 'Insufficient permissions');
      
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
};
