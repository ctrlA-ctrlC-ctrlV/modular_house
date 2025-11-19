import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';

const router: Router = Router();

// Health check endpoint
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthCheck);
}));

export default router;