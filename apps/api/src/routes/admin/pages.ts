import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PagesService } from '../../services/content/pages.js';
import { authenticateJWT, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';

const router: Router = Router();

// Validation schemas
const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase kebab-case'),
  heroHeadline: z.string().optional(),
  heroSubhead: z.string().optional(),
  heroImageId: z.string().uuid().optional().nullable(),
  sections: z.array(z.unknown()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

const updatePageSchema = pageSchema.partial();

// Apply auth middleware to all routes
router.use(authenticateJWT);
router.use(requireRole('admin'));

// List all pages
router.get('/', async (_req: Request, res: Response) => {
  try {
    const pages = await PagesService.findAll();
    res.json(pages);
  } catch (error) {
    logger.error({ error }, 'Failed to list pages');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get page by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const page = await PagesService.findById(req.params.id);
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    res.json(page);
  } catch (error) {
    logger.error({ error, id: req.params.id }, 'Failed to get page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create page
router.post('/', validate({ body: pageSchema }), async (req: Request, res: Response) => {
  try {
    const page = await PagesService.create(req.body);
    logger.info({ pageId: page.id, user: req.user?.email }, 'Page created');
    res.status(201).json(page);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
      return;
    }
    logger.error({ error }, 'Failed to create page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update page
router.put('/:id', validate({ body: updatePageSchema }), async (req: Request, res: Response) => {
  try {
    const page = await PagesService.update(req.params.id, req.body);
    logger.info({ pageId: page.id, user: req.user?.email }, 'Page updated');
    res.json(page);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Not found', message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ error: 'Conflict', message: error.message });
      return;
    }
    logger.error({ error, id: req.params.id }, 'Failed to update page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete page
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await PagesService.delete(req.params.id);
    logger.info({ pageId: req.params.id, user: req.user?.email }, 'Page deleted');
    res.status(204).send();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    logger.error({ error, id: req.params.id }, 'Failed to delete page');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as pagesRouter };
