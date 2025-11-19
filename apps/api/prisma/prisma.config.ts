import { config } from '../src/config/env.js';

// Set the environment variable before importing PrismaClient
process.env.DATABASE_URL = config.database.url;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient;
