import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Import config
import { config } from './config/env.js';

// Import middleware
import { httpLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Import routes
import healthRouter from './routes/health.js';
import submissionsRouter from './routes/submissions.js';
import analyticsRouter from './routes/analytics.js';
import { authRouter } from './routes/admin/auth.js';
import { pagesRouter } from './routes/admin/pages.js';
import { galleryRouter } from './routes/admin/gallery.js';
import { faqsRouter } from './routes/admin/faqs.js';
import { submissionsRouter as adminSubmissionsRouter } from './routes/admin/submissions.js';
import { redirectsRouter } from './routes/admin/redirects.js';
import { uploadsRouter } from './routes/admin/uploads.js';
import { settingsRouter } from './routes/admin/settings.js';
import adminAnalyticsRouter from './routes/admin/analytics.js';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration from environment
const corsOptions = {
  origin: config.app.corsOrigin.includes(',')
    ? config.app.corsOrigin.split(',').map((origin) => origin.trim())
    : config.app.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Cookie parsing (needed for refresh-token cookie reads in admin auth routes).
app.use(cookieParser());

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(httpLogger);

// Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Routes
app.use('/health', healthRouter);
app.use('/submissions', submissionsRouter);
// Public analytics ingest — POST /api/analytics/events (plan §2.3 M1).
// Mounted after httpLogger so every request carries a correlation id (req.id),
// and before notFoundHandler so the route is reachable. The route applies its
// own rate limit + validate middleware internally (T043).
app.use('/api/analytics', analyticsRouter);
app.use('/admin/auth', authRouter);
app.use('/admin/pages', pagesRouter);
app.use('/admin/gallery', galleryRouter);
app.use('/admin/faqs', faqsRouter);
app.use('/admin/submissions', adminSubmissionsRouter);
app.use('/admin/redirects', redirectsRouter);
app.use('/admin/uploads', uploadsRouter);
app.use('/admin/settings', settingsRouter);
// Admin analytics dashboard — GET overview/realtime (plan §5.1, T-B5-T-B7).
// Mounted after httpLogger (every request already carries a correlation id,
// req.id) and behind the same authenticateJWT gate as the other admin
// routers; no separate requirePermission layer (FR-017: any admin role).
app.use('/api/admin/analytics', adminAnalyticsRouter);

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Modular House API' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;