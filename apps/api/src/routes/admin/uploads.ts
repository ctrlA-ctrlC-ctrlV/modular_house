import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../../middleware/auth.js';
import { logger } from '../../middleware/logger.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Configure upload limits and filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // 500KB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Error handling wrapper for multer
const uploadSingle = (req: Request, res: Response, next: NextFunction) => {
  const uploadMiddleware = upload.single('image');
  
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'File size must be less than 500KB',
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: err.message,
      });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({
        error: 'Invalid file',
        message: err.message,
      });
    }
    // Everything went fine.
    next();
  });
};

/**
 * POST /admin/uploads/image
 * Upload an image file
 */
router.post('/image', authenticateJWT, uploadSingle, (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Missing file',
      message: 'No image file provided',
    });
  }

  logger.info({ 
    userId: req.user?.userId, 
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype 
  }, 'Admin uploaded image');

  // Return the URL to the uploaded file
  // Assuming the API serves static files from /uploads
  const url = `/uploads/${req.file.filename}`;

  res.status(201).json({
    url,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export const uploadsRouter: Router = router;
