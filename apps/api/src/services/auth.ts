/**
 * AuthService — Phase 1 rewrite
 *
 * Implements the full admin authentication flow:
 *   verifyCredentials  → lockout guard + argon2 verify + OTP issue (A1–A6, B7)
 *   verifyOtp          → OTP verify + access JWT + refresh token (B7, E1–E3)
 *   refresh            → family rotation + idle timeout (E4, E7)
 *   logout             → single-family revocation (E5)
 *   revokeAllSessions  → account-wide revocation (C6, E6)
 *   changePassword     → revoke-all + re-mint acting family (D5, E6)
 *
 * Legacy helpers kept for backward compat:
 *   verifyToken      — used by authenticateJWT middleware
 *   hashPassword     — used by scripts
 *   createUser       — used by provisioning scripts
 *   authenticateUser — used by the login-route stub until T033 replaces it
 */

import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { LoginCodeService } from './loginCode.js';
import { MailerService } from './mailer.js';
import { logger } from '../middleware/logger.js';
import { config } from '../config/env.js';
import {
  LOCKOUT_THRESHOLD,
  LOCKOUT_DURATION_MS,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL_MS,
  IDLE_TIMEOUT_MS,
} from '../config/adminAuth.js';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  /** Effective permission strings in `resource:action` format (E1). */
  permissions: string[];
  iat?: number;
  exp?: number;
}

export type CredentialResult =
  | { success: true; challengeId: string }
  | { success: false; status: 401 | 423; message: string };

export type OtpResult =
  | { success: true; accessToken: string; rawRefreshToken: string; userId: string }
  | { success: false; status: number; message: string };

export type RefreshResult =
  | { success: true; accessToken: string; rawRefreshToken: string }
  | { success: false; status: number; message: string };

export type ChangePasswordResult =
  | { success: true; accessToken: string; rawRefreshToken: string }
  | { success: false; status: number; message: string };

// ---------------------------------------------------------------------------
// User row shape returned by loadUser (includes role + permissions)
// ---------------------------------------------------------------------------

type UserWithRole = {
  id: string;
  email: string;
  passwordHash: string;
  roleId: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  role: {
    id: string;
    name: string;
    permissions: Array<{
      permission: { resource: string; action: string };
    }>;
  };
};

// ---------------------------------------------------------------------------
// Internal helpers (module-level, no hidden state)
// ---------------------------------------------------------------------------

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

function derivePermissions(user: UserWithRole): string[] {
  return user.role.permissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}`,
  );
}

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------

export class AuthService {
  private readonly prisma: PrismaClient;
  private readonly clock: () => Date;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly loginCodeService: LoginCodeService;
  private readonly mailerService: MailerService;

  constructor(
    prisma?: PrismaClient,
    clock?: () => Date,
    loginCodeService?: LoginCodeService,
    mailerService?: MailerService,
  ) {
    this.prisma = prisma ?? new PrismaClient();
    this.clock = clock ?? (() => new Date());
    this.jwtSecret = config.security.jwtSecret;
    this.jwtExpiresIn = config.security.jwtExpiresIn;
    this.loginCodeService = loginCodeService ?? new LoginCodeService(this.prisma, this.clock);
    this.mailerService = mailerService ?? new MailerService();

    if (
      config.app.nodeEnv === 'production' &&
      this.jwtSecret === 'your-jwt-secret-key-change-in-production'
    ) {
      throw new Error('JWT_SECRET must be set in production');
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private mintAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload as object, this.jwtSecret, {
      expiresIn: ACCESS_TOKEN_TTL,
    } as SignOptions);
  }

  private async createRefreshToken(userId: string, family: string): Promise<string> {
    const raw = generateRawToken();
    const tokenHash = hashToken(raw);
    const now = this.clock();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        lastUsedAt: now,
      },
    });
    return raw;
  }

  private async loadUser(userId: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    }) as Promise<UserWithRole | null>;
  }

  // -------------------------------------------------------------------------
  // Phase 1 public API
  // -------------------------------------------------------------------------

  /**
   * Step 1 of the 2-FA login flow (A1–A6, B7).
   *
   * Verifies credentials and enforces lockout.  Issues an OTP on success.
   * Does NOT mint an access token — that happens only after OTP verify (B7).
   */
  async verifyCredentials(email: string, password: string): Promise<CredentialResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = this.clock();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    // A5: unknown email — identical response to wrong password (no enumeration)
    if (!user) {
      return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // A3: account currently locked
    if (user.lockedUntil && user.lockedUntil > now) {
      return { success: false, status: 423, message: 'Account temporarily locked' };
    }

    // A6: deactivated account — same generic 401 as wrong credentials
    if (!user.isActive) {
      return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // A1: verify password with argon2id
    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      // A2/A3: increment failure counter; lock at threshold
      const newCount = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: newCount };
      if (newCount >= LOCKOUT_THRESHOLD) {
        updateData.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      // A5: same generic response as unknown email
      return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // A4: successful verify — reset lockout counters
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });

    // B7: issue OTP (access token NOT minted here)
    const { code, challengeId } = await this.loginCodeService.issue(user.id);

    // B8: deliver code via email
    await this.mailerService.sendEmail({
      to: user.email,
      subject: 'Your login verification code',
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    });

    return { success: true, challengeId };
  }

  /**
   * Step 2 of the 2-FA login flow (B7, E1–E3).
   *
   * Verifies the OTP and — only on success — mints a 15-minute access token
   * and a rotating httpOnly refresh token.
   */
  async verifyOtp(challengeId: string, code: string): Promise<OtpResult> {
    const verifyResult = await this.loginCodeService.verify(challengeId, code);
    if (!verifyResult.success) {
      return { success: false, status: 401, message: 'Invalid or expired code' };
    }

    const user = await this.loadUser(verifyResult.userId);
    if (!user) {
      return { success: false, status: 401, message: 'Invalid credentials' };
    }

    // E1: effective permissions from Role → RolePermission → Permission
    const permissions = derivePermissions(user);

    // E1: 15-minute access token
    const accessToken = this.mintAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });

    // E3: create rotating refresh token (opaque, only hash stored in DB)
    const family = randomBytes(16).toString('hex');
    const rawRefreshToken = await this.createRefreshToken(user.id, family);

    return { success: true, accessToken, rawRefreshToken, userId: user.id };
  }

  /**
   * Refresh-token rotation (E4, E7).
   *
   * Validates the submitted raw token, enforces idle timeout and absolute
   * expiry, revokes the current token, and issues a new one in the same
   * family.  Reuse of a revoked token triggers full-family revocation (E4).
   */
  async refresh(rawToken: string): Promise<RefreshResult> {
    const tokenHash = hashToken(rawToken);
    const now = this.clock();

    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });

    if (!stored) {
      return { success: false, status: 401, message: 'Invalid refresh token' };
    }

    // E4: revoked-token reuse → revoke entire family (theft detection)
    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { family: stored.family },
        data: { revokedAt: now },
      });
      return { success: false, status: 401, message: 'Invalid refresh token' };
    }

    // Absolute expiry check
    if (stored.expiresAt < now) {
      return { success: false, status: 401, message: 'Refresh token expired' };
    }

    // E7: idle timeout — reject if no activity within IDLE_TIMEOUT_MS
    if (
      stored.lastUsedAt !== null &&
      stored.lastUsedAt !== undefined &&
      now.getTime() - new Date(stored.lastUsedAt as Date).getTime() > IDLE_TIMEOUT_MS
    ) {
      return { success: false, status: 401, message: 'Session idle timeout' };
    }

    // E4: rotate — revoke old token, issue new in same family
    await this.prisma.refreshToken.update({
      where: { id: stored.id as string },
      data: { revokedAt: now },
    });

    const user = await this.loadUser(stored.userId as string);
    if (!user) {
      return { success: false, status: 401, message: 'User not found' };
    }

    const permissions = derivePermissions(user);
    const accessToken = this.mintAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    });
    const rawRefreshToken = await this.createRefreshToken(user.id, stored.family as string);

    return { success: true, accessToken, rawRefreshToken };
  }

  /**
   * Logout — revokes the current session's refresh-token family only (E5).
   *
   * Silently succeeds if the token is not found (idempotent).
   */
  async logout(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (!stored) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { family: stored.family },
      data: { revokedAt: this.clock() },
    });
  }

  /**
   * Account-wide session revocation (C6, E6).
   *
   * Revokes all refresh-token families for `userId`.  Called on password
   * reset (C6) and as the first step of a settings-page password change (E6).
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: this.clock() },
    });
  }

  /**
   * Password change (D5, E6).
   *
   * Verifies the current password, hashes and stores the new one, revokes
   * all sessions, and re-mints a fresh token for the acting session's
   * family so the user stays logged in (E6).
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    actingFamily: string,
  ): Promise<ChangePasswordResult> {
    const user = await this.loadUser(userId);
    if (!user) {
      return { success: false, status: 401, message: 'User not found' };
    }

    // D5: current password must be correct
    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      return { success: false, status: 401, message: 'Invalid current password' };
    }

    const newHash = await argon2.hash(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    // E6: revoke all sessions
    await this.revokeAllSessions(userId);

    // E6: re-mint acting session
    const permissions = derivePermissions(user);
    const accessToken = this.mintAccessToken({
      userId,
      email: user.email,
      role: user.role.name,
      permissions,
    });
    const rawRefreshToken = await this.createRefreshToken(userId, actingFamily);

    return { success: true, accessToken, rawRefreshToken };
  }

  // -------------------------------------------------------------------------
  // Legacy helpers (backward compat — updated to use injected this.prisma)
  // -------------------------------------------------------------------------

  /**
   * Legacy credential check used by the login-route stub.
   *
   * @deprecated Use verifyCredentials directly (wired in T033).
   */
  async authenticateUser(
    email: string,
    password: string,
  ): Promise<{ success: boolean; token?: string; user?: { id: string; email: string; role: string }; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          isActive: true,
          role: { select: { name: true } },
        },
      });

      if (!user) {
        logger.warn({ email: normalizedEmail }, 'Authentication failed: user not found');
        return { success: false, error: 'Invalid credentials' };
      }

      const isValidPassword = await argon2.verify(user.passwordHash, password);
      if (!isValidPassword) {
        logger.warn({ userId: user.id }, 'Authentication failed: invalid password');
        return { success: false, error: 'Invalid credentials' };
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: this.clock() },
      });

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        permissions: [],
      };

      const token = jwt.sign(tokenPayload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
      } as SignOptions);

      logger.info({ userId: user.id }, 'Credentials verified (legacy stub path)');
      return { success: true, token, user: { id: user.id, email: user.email, role: user.role.name } };
    } catch (error) {
      logger.error({ error, email }, 'Authentication error');
      return { success: false, error: 'Authentication failed' };
    }
  }

  /** Hash a password with argon2id.  Used by provisioning scripts. */
  async hashPassword(password: string): Promise<string> {
    try {
      return await argon2.hash(password);
    } catch (error) {
      logger.error({ error }, 'Password hashing error');
      throw new Error('Password hashing failed');
    }
  }

  /** Verify and decode an access token.  Used by the authenticateJWT middleware. */
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

  /** Create a new user account.  Used by provisioning scripts. */
  async createUser(
    email: string,
    password: string,
    roleName = 'admin',
  ): Promise<{ success: boolean; user?: { id: string; email: string }; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      const passwordHash = await this.hashPassword(password);
      const role = await this.prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        return { success: false, error: `Role '${roleName}' not found` };
      }

      const user = await this.prisma.user.create({
        data: { email: normalizedEmail, passwordHash, roleId: role.id },
        select: { id: true, email: true },
      });

      logger.info({ userId: user.id, email: user.email }, 'User created');
      return { success: true, user: { id: user.id, email: user.email } };
    } catch (error) {
      logger.error({ error, email }, 'User creation error');
      return { success: false, error: 'User creation failed' };
    }
  }
}
