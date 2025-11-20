import { beforeAll, afterAll, beforeEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Default test environment variables if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Set other test defaults
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MAIL_HOST = 'localhost';
process.env.MAIL_PORT = '1025';
process.env.MAIL_FROM_EMAIL = 'test@example.com';
process.env.MAIL_INTERNAL_TO = 'admin@example.com';
process.env.CORS_ORIGIN = 'http://localhost:3000';

beforeAll(async () => {
  // Global test setup
});

afterAll(async () => {
  // Global test cleanup
});

beforeEach(async () => {
  // Reset between tests if needed
});