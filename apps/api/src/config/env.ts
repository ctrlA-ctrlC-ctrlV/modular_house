import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Get current file directory for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from multiple possible locations (monorepo context)
const possibleEnvPaths = [
  path.resolve(__dirname, '../../../.env'),           // From apps/api/src/config -> root
  path.resolve(process.cwd(), '.env'),                // From current working directory
  path.resolve(process.cwd(), '../../.env'),          // From apps/api -> root
];

let envLoaded = false;
for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    console.log(`[Config] Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('[Config] No .env file found, using process environment only');
}

interface DatabaseConfig {
  url: string;
}

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  internalTo: string;
  rejectUnauthorized: boolean;
}

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
  passwordSaltRounds: number;
  ipSalt: string;
  cookieDomain: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  customerConfirmEnabled: boolean;
  robotsAllow: boolean;
  /**
   * Absolute filesystem path to the directory containing configurator
   * floor plan SVG assets. Used by the submission pipeline to attach
   * the selected floor plan to the internal notification email. In
   * development the default resolves to the web app's public folder;
   * in production the Dockerfile copies the assets into the API image
   * and this path is set via the FLOORPLAN_ASSETS_DIR env var.
   */
  floorplanAssetsDir: string;
}

interface AdminConfig{
  adminEmail: string;
  adminPassword: string;
}

interface EnvConfig {
  app: AppConfig;
  database: DatabaseConfig;
  mail: MailConfig;
  security: SecurityConfig;
  admin: AdminConfig;
}



function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getNumericEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

function getBooleanEnvVar(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Validate and load configuration
export const config: EnvConfig = {
  app: {
    port: getNumericEnvVar('PORT', 8080),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3000'),
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    customerConfirmEnabled: getBooleanEnvVar('CUSTOMER_CONFIRM_ENABLED', true),
    robotsAllow: getBooleanEnvVar('ROBOTS_ALLOW', false),
    // Resolve floor plan assets directory. Honour an explicit override
    // when supplied (production / Docker), otherwise fall back to the
    // monorepo location used during local development.
    floorplanAssetsDir: getEnvVar(
      'FLOORPLAN_ASSETS_DIR',
      path.resolve(process.cwd(), '../web/public/resource/floorplan'),
    ),
  },
  database: {
    url: getRequiredEnvVar('DATABASE_URL'),
  },
  mail: {
    host: getRequiredEnvVar('MAIL_HOST'),
    port: getNumericEnvVar('MAIL_PORT', 587),
    secure: getBooleanEnvVar('MAIL_SECURE', false),
    user: getEnvVar('MAIL_USER', ''),
    pass: getEnvVar('MAIL_PASS', ''),
    fromName: getEnvVar('MAIL_FROM_NAME', 'Modular House'),
    fromEmail: getRequiredEnvVar('MAIL_FROM_EMAIL'),
    internalTo: getRequiredEnvVar('MAIL_INTERNAL_TO'),
    rejectUnauthorized: getBooleanEnvVar('MAIL_REJECT_UNAUTHORIZED', true),
  },
  security: {
    jwtSecret: getRequiredEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '24h'),
    refreshTokenSecret: getRequiredEnvVar('REFRESH_TOKEN_SECRET'),
    refreshTokenExpiresIn: getEnvVar('REFRESH_TOKEN_EXPIRES_IN', '7d'),
    passwordSaltRounds: getNumericEnvVar('PASSWORD_SALT_ROUNDS', 12),
    ipSalt: getRequiredEnvVar('IP_SALT'),
    cookieDomain: getEnvVar('COOKIE_DOMAIN', 'localhost'),
  },  
  admin: {
    adminEmail: getEnvVar("ADMIN_LOGIN_EMAIL", "testadmin@modular.house"),
    adminPassword: getEnvVar("ADMIN_LOGIN_PASSWORD", "admin123!"),
  }
};

// Validate configuration on load
if (config.app.nodeEnv === 'production') {
  if (config.security.jwtSecret === 'your-jwt-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed from default value in production');
  }
  if (config.security.refreshTokenSecret === 'your-refresh-token-secret-change-in-production') {
    throw new Error('REFRESH_TOKEN_SECRET must be changed from default value in production');
  }
  if (config.security.passwordSaltRounds < 10) {
    throw new Error('PASSWORD_SALT_ROUNDS must be at least 10 in production');
  }
  if (config.admin.adminEmail === 'testadmin@modular.house') {
    throw new Error('ADMIN_LOGIN_EMAIL must be changed from default value in production');
  }
  if (config.admin.adminPassword === 'admin123!') {
    throw new Error('ADMIN_LOGIN_PASSWORD must be changed from default value in production');
  }
}