import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import config
import { config } from './config/env.js';

// Import middleware
import { httpLogger } from './middleware/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

// Import routes
import healthRouter from './routes/health.js';
import submissionsRouter from './routes/submissions.js';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration from environment
const corsOptions = {
  origin: config.app.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(httpLogger);

// Routes
app.use('/health', healthRouter);
app.use('/submissions', submissionsRouter);

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Modular House API' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;