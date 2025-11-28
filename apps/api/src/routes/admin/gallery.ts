import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GalleryCategory, PublishStatus } from '@prisma/client';
import { GalleryService } from '../../services/content/gallery.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

const router = Router();

// Validation schemas
const createGalleryItemBody = z.object({
  title: z.string().min(1, 'Title is required'),
  caption: z.string().optional(),
  category: z.nativeEnum(GalleryCategory),
  imageUrl: z.string().url('Invalid image URL'),
  altText: z.string().min(1, 'Alt text is required'),
  projectDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  publishStatus: z.nativeEnum(PublishStatus).optional(),
});

const updateGalleryItemParams = z.object({
  id: z.string().uuid('Invalid ID format'),
});

const updateGalleryItemBody = z.object({
  title: z.string().min(1).optional(),
  caption: z.string().optional(),
  category: z.nativeEnum(GalleryCategory).optional(),
  imageUrl: z.string().url().optional(),
  altText: z.string().min(1).optional(),
  projectDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  publishStatus: z.nativeEnum(PublishStatus).optional(),
});

// Routes
router.use(authenticateJWT); // Protect all routes

// List
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Cast query params to enum types if they match, otherwise undefined
    const category = Object.values(GalleryCategory).includes(req.query.category as unknown as GalleryCategory) 
      ? (req.query.category as GalleryCategory) 
      : undefined;
      
    const publishStatus = Object.values(PublishStatus).includes(req.query.publishStatus as unknown as PublishStatus)
      ? (req.query.publishStatus as PublishStatus)
      : undefined;
    
    const items = await GalleryService.findAll({ category, publishStatus });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get one
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await GalleryService.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Gallery item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Create
router.post('/', validate({ body: createGalleryItemBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await GalleryService.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

// Update
router.put('/:id', validate({ params: updateGalleryItemParams, body: updateGalleryItemBody }), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await GalleryService.update(id, req.body);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Delete
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await GalleryService.delete(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export const galleryRouter: Router = router;
