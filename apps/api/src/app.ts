import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Application = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Modular House API' });
});

export default app;