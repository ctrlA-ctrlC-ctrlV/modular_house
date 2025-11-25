import * as argon2 from 'argon2';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import { config } from '../config/env.js';

const prisma = new PrismaClient();

interface AuthResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  error?: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = config.security.jwtSecret;
    this.jwtExpiresIn = config.security.jwtExpiresIn;
    
    if (config.app.nodeEnv === 'production' && this.jwtSecret === 'your-jwt-secret-key-change-in-production') {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      // Normalize email to lowercase for case-insensitive comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          roles: true,
        },
      });

      if (!user) {
        logger.warn({ email: normalizedEmail }, 'Authentication failed: user not found');
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password using argon2
      const isValidPassword = await argon2.verify(user.passwordHash, password);
      
      if (!isValidPassword) {
        logger.warn({ userId: user.id, email: normalizedEmail }, 'Authentication failed: invalid password');
        return { success: false, error: 'Invalid credentials' };
      }

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      };

      const token = jwt.sign(tokenPayload, this.jwtSecret, { 
        expiresIn: this.jwtExpiresIn
      } as SignOptions);

      logger.info({ userId: user.id, email: user.email }, 'User authenticated successfully');

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      };
    } catch (error) {
      logger.error({ error, email }, 'Authentication error');
      return { success: false, error: 'Authentication failed' };
    }
  }

  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password);
    } catch (error) {
      logger.error({ error }, 'Password hashing error');
      throw new Error('Password hashing failed');
    }
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid token');
      } else {
        logger.error({ error }, 'Token verification error');
      }
      return null;
    }
  }

  async createUser(email: string, password: string, roles: string[] = ['admin']): Promise<{ success: boolean; user?: { id: string; email: string }; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      const passwordHash = await this.hashPassword(password);
      
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          roles,
        },
        select: {
          id: true,
          email: true,
        },
      });

      logger.info({ userId: user.id, email: user.email }, 'User created successfully');

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      logger.error({ error, email }, 'User creation error');
      return { success: false, error: 'User creation failed' };
    }
  }
}