import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { RedirectsService } from '../../services/content/redirects.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Validation schemas
const createRedirectBody = z.object({
  sourceSlug: z.string().min(1, 'Source slug is required'),
  destinationUrl: z.string().min(1, 'Destination URL is required'),
  active: z.boolean().optional(),
});

const updateRedirectParams = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const updateRedirectBody = z.object({
  sourceSlug: z.string().min(1).optional(),
  destinationUrl: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

// Routes
router.use(authenticateJWT); // Protect all routes

// List
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await RedirectsService.findAll();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get one
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await RedirectsService.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Redirect not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Create
router.post('/', validate({ body: createRedirectBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await RedirectsService.create(req.body);
    res.status(201).json(item);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Redirect loop detected')) {
      res.status(400).json({ error: 'Validation Error', message: error.message });
      return;
    }
    // Handle unique constraint violation for sourceSlug
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Conflict', message: 'Redirect with this source slug already exists' });
      return;
    }
    next(error);
  }
});

// Update
router.put('/:id', validate({ params: updateRedirectParams, body: updateRedirectBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await RedirectsService.update(id, req.body);
    res.json(item);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Redirect loop detected')) {
      res.status(400).json({ error: 'Validation Error', message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'Redirect not found') {
      res.status(404).json({ error: 'Redirect not found' });
      return;
    }
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Conflict', message: 'Redirect with this source slug already exists' });
      return;
    }
    next(error);
  }
});

// Delete
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await RedirectsService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const redirectsRouter: Router = router;
