import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dotenv so the .env file is never loaded – only process.env matters
vi.mock('dotenv', () => ({
  config: vi.fn(),
  default: { config: vi.fn() },
}));

/**
 * Tests for src/config/env.ts
 *
 * The config module executes at import time, so we use vi.resetModules()
 * and dynamic import() to re-execute it with different env vars for each test.
 */
describe('config/env', () => {
  const ORIGINAL_ENV = { ...process.env };

  /** Minimal env vars that allow the module to load without throwing. */
  function setRequiredEnvVars(overrides: Record<string, string> = {}) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.MAIL_HOST = 'localhost';
    process.env.MAIL_FROM_EMAIL = 'test@example.com';
    process.env.MAIL_INTERNAL_TO = 'admin@example.com';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
    process.env.IP_SALT = 'test-ip-salt';
    process.env.NODE_ENV = 'test';

    for (const [k, v] of Object.entries(overrides)) {
      process.env[k] = v;
    }
  }

  beforeEach(() => {
    vi.resetModules();
    // Wipe all env vars so we start clean
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL_ENV);
  });

  // -----------------------------------------------------------------------
  // getRequiredEnvVar – missing value branch
  // -----------------------------------------------------------------------
  it('should throw when a required env var is missing', async () => {
    // Set all required vars EXCEPT DATABASE_URL
    setRequiredEnvVars();
    delete process.env.DATABASE_URL;

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'Required environment variable DATABASE_URL is not set',
    );
  });

  // -----------------------------------------------------------------------
  // getNumericEnvVar – NaN branch
  // -----------------------------------------------------------------------
  it('should throw when a numeric env var is not a valid number', async () => {
    setRequiredEnvVars({ MAIL_PORT: 'not-a-number' });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'Environment variable MAIL_PORT must be a valid number',
    );
  });

  // -----------------------------------------------------------------------
  // getNumericEnvVar – valid number branch
  // -----------------------------------------------------------------------
  it('should parse numeric env vars correctly', async () => {
    setRequiredEnvVars({ PORT: '9999', MAIL_PORT: '2525' });

    const { config } = await import('../../../src/config/env.js');
    expect(config.app.port).toBe(9999);
    expect(config.mail.port).toBe(2525);
  });

  // -----------------------------------------------------------------------
  // getBooleanEnvVar – explicit true/false values
  // -----------------------------------------------------------------------
  it('should parse boolean env vars correctly', async () => {
    setRequiredEnvVars({
      CUSTOMER_CONFIRM_ENABLED: 'false',
      ROBOTS_ALLOW: 'true',
      MAIL_SECURE: 'true',
    });

    const { config } = await import('../../../src/config/env.js');
    expect(config.app.customerConfirmEnabled).toBe(false);
    expect(config.app.robotsAllow).toBe(true);
    expect(config.mail.secure).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Production validation – JWT_SECRET default
  // -----------------------------------------------------------------------
  it('should throw in production if JWT_SECRET is the default', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'your-jwt-secret-key-change-in-production',
    });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'JWT_SECRET must be changed from default value in production',
    );
  });

  // -----------------------------------------------------------------------
  // Production validation – REFRESH_TOKEN_SECRET default
  // -----------------------------------------------------------------------
  it('should throw in production if REFRESH_TOKEN_SECRET is the default', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'good-secret',
      REFRESH_TOKEN_SECRET: 'your-refresh-token-secret-change-in-production',
    });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'REFRESH_TOKEN_SECRET must be changed from default value in production',
    );
  });

  // -----------------------------------------------------------------------
  // Production validation – PASSWORD_SALT_ROUNDS too low
  // -----------------------------------------------------------------------
  it('should throw in production if PASSWORD_SALT_ROUNDS is below 10', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'good-secret',
      REFRESH_TOKEN_SECRET: 'good-refresh-secret',
      PASSWORD_SALT_ROUNDS: '4',
    });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'PASSWORD_SALT_ROUNDS must be at least 10 in production',
    );
  });

  // -----------------------------------------------------------------------
  // Production validation – ADMIN_LOGIN_EMAIL default
  // -----------------------------------------------------------------------
  it('should throw in production if ADMIN_LOGIN_EMAIL is the default', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'good-secret',
      REFRESH_TOKEN_SECRET: 'good-refresh-secret',
      PASSWORD_SALT_ROUNDS: '12',
    });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'ADMIN_LOGIN_EMAIL must be changed from default value in production',
    );
  });

  // -----------------------------------------------------------------------
  // Production validation – ADMIN_LOGIN_PASSWORD default
  // -----------------------------------------------------------------------
  it('should throw in production if ADMIN_LOGIN_PASSWORD is the default', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'good-secret',
      REFRESH_TOKEN_SECRET: 'good-refresh-secret',
      PASSWORD_SALT_ROUNDS: '12',
      ADMIN_LOGIN_EMAIL: 'real-admin@example.com',
    });

    await expect(import('../../../src/config/env.js')).rejects.toThrow(
      'ADMIN_LOGIN_PASSWORD must be changed from default value in production',
    );
  });

  // -----------------------------------------------------------------------
  // Production validation – passes when everything is configured
  // -----------------------------------------------------------------------
  it('should load without error when production config is correct', async () => {
    setRequiredEnvVars({
      NODE_ENV: 'production',
      JWT_SECRET: 'good-secret',
      REFRESH_TOKEN_SECRET: 'good-refresh-secret',
      PASSWORD_SALT_ROUNDS: '12',
      ADMIN_LOGIN_EMAIL: 'real-admin@example.com',
      ADMIN_LOGIN_PASSWORD: 'StrongP@ss1!',
    });

    const { config } = await import('../../../src/config/env.js');
    expect(config.app.nodeEnv).toBe('production');
  });
});
