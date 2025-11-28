import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FaqsService } from '../../services/content/faqs.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Validation schemas
const createFAQBody = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  displayOrder: z.number().int().optional(),
});

const updateFAQParams = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const updateFAQBody = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
});

// Routes
router.use(authenticateJWT); // Protect all routes

// List
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await FaqsService.findAll();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get one
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await FaqsService.findById(id);
    if (!item) {
      res.status(404).json({ error: 'FAQ not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Create
router.post('/', validate({ body: createFAQBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await FaqsService.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Update
router.patch('/:id', validate({ params: updateFAQParams, body: updateFAQBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await FaqsService.update(id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Delete
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await FaqsService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const faqsRouter: Router = router;
