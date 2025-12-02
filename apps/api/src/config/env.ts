import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
}

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  passwordSaltRounds: number;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  customerConfirmEnabled: boolean;
  robotsAllow: boolean;
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
    corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
    logLevel: getEnvVar('LOG_LEVEL', 'info'),
    customerConfirmEnabled: getBooleanEnvVar('CUSTOMER_CONFIRM_ENABLED', true),
    robotsAllow: getBooleanEnvVar('ROBOTS_ALLOW', false),
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
  },
  security: {
    jwtSecret: getRequiredEnvVar('JWT_SECRET'),
    jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '24h'),
    passwordSaltRounds: getNumericEnvVar('PASSWORD_SALT_ROUNDS', 12),
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