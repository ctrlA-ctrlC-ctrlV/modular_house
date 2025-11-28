import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubmissionsExportService } from '../../services/submissionsExport.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Validation schemas
const listSubmissionsQuery = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(50),
});

// Routes
router.use(authenticateJWT); // Protect all routes

// List
router.get('/', validate({ query: listSubmissionsQuery }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await SubmissionsExportService.findAll(page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Export CSV
router.get('/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const csv = await SubmissionsExportService.exportToCsv();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=submissions-${new Date().toISOString().split('T')[0]}.csv`);
    
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export const submissionsRouter: Router = router;
