// Prisma configuration file
// This file is used to set environment variables before Prisma CLI operations

import { config } from '../src/config/env.js';

// Set DATABASE_URL for Prisma CLI tools (migrate, generate, etc.)
process.env.DATABASE_URL = config.database.url;
