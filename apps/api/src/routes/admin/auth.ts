import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import { AuthService } from '../../services/auth.js';
import { LoginCodeService } from '../../services/loginCode.js';
import { PasswordResetTokenService } from '../../services/passwordResetToken.js';
import { validatePassword } from '../../services/passwordPolicy.js';
import { MailerService } from '../../services/mailer.js';
import { config } from '../../config/env.js';
import {
  ACCESS_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
  RATE_WINDOW_MAX_REQUESTS,
  RATE_WINDOW_MS,
} from '../../config/adminAuth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router: Router = Router();

// Apply the auth-route IP rate limit to every endpoint under /admin/auth (F4).
router.use(authRateLimit);

// Login request schema
const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').min(1, 'Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(128, 'Password too long'),
});

// Step 1 — verify credentials and issue a one-time code (no session yet).
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const authService = new AuthService();

    const result = await authService.verifyCredentials(email.toLowerCase().trim(), password);

    if (!result.success) {
      res.status(result.status).json({
        error: result.status === 423 ? 'Locked' : 'Unauthorized',
        message: result.message,
      });
      return;
    }

    logger.info({ email: email.toLowerCase().trim() }, 'Credentials verified; OTP issued');

    res.status(200).json({
      challengeId: result.challengeId,
      message: 'A verification code has been sent to your email.',
    });
  } catch (error) {
    logger.error({ error }, 'Login endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Verify-2FA request schema
const verify2faSchema = z.object({
  challengeId: z.string({ required_error: 'Challenge ID is required' }).min(1, 'Challenge ID is required'),
  code: z.string({ required_error: 'Code is required' }).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

/**
 * Build the Session.user payload from a fully-loaded user row.
 *
 * Mirrors the `Me` schema in the admin-auth OpenAPI contract:
 * id, email, displayName, role, permissions, hasProfilePhoto, isSuperAdmin, preferences.
 */
async function buildSessionUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      preference: true,
    },
  });

  if (!user) {
    return null;
  }

  const permissions = user.role.permissions.map(
    (rp) => `${rp.permission.resource}:${rp.permission.action}`,
  );

  const preferences = user.preference ?? { themeMode: 'system', sidebarCollapsed: false };

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role.name,
    permissions,
    hasProfilePhoto: user.profilePhoto !== null && user.profilePhotoMime !== null,
    isSuperAdmin: user.role.name === 'super_admin',
    preferences: {
      themeMode: preferences.themeMode,
      sidebarCollapsed: preferences.sidebarCollapsed,
    },
  };
}

// Step 2 — verify the one-time code and establish the session.
router.post('/verify-2fa', validate({ body: verify2faSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeId, code } = req.body;
    const authService = new AuthService();

    const result = await authService.verifyOtp(challengeId, code);

    if (!result.success) {
      res.status(result.status).json({
        error: 'Unauthorized',
        message: result.message,
      });
      return;
    }

    const sessionUser = await buildSessionUser(result.userId);
    if (!sessionUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
      return;
    }

    logger.info({ userId: result.userId }, 'OTP verified; session established');

    // E3: rotating refresh token delivered as an httpOnly, SameSite=Strict cookie.
    res.cookie('refreshToken', result.rawRefreshToken, {
      httpOnly: true,
      secure: config.app.nodeEnv === 'production',
      sameSite: 'strict',
      domain: config.security.cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(200).json({
      accessToken: result.accessToken,
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
      user: sessionUser,
    });
  } catch (error) {
    logger.error({ error }, 'Verify-2FA endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Resend-code request schema
const resendCodeSchema = z.object({
  challengeId: z.string({ required_error: 'Challenge ID is required' }).min(1, 'Challenge ID is required'),
});

/**
 * Check whether a resend-code request is currently throttled for `userId`.
 *
 * Cooldown (F1): the most recent LoginCode row for the user must be older than
 * RESEND_COOLDOWN_MS. Window cap (F2): the count of LoginCode rows created within
 * the trailing RATE_WINDOW_MS must be below RATE_WINDOW_MAX_REQUESTS.
 *
 * Returns `'cooldown' | 'window_cap' | null` where null means the request may proceed.
 */
async function checkResendThrottle(userId: string): Promise<'cooldown' | 'window_cap' | null> {
  const now = new Date();

  const latest = await prisma.loginCode.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return 'cooldown';
  }

  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
  const countInWindow = await prisma.loginCode.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
  });

  if (countInWindow >= RATE_WINDOW_MAX_REQUESTS) {
    return 'window_cap';
  }

  return null;
}

// Resend a one-time code for an existing challenge (B6, B9, F1, F2).
router.post('/resend-code', validate({ body: resendCodeSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeId } = req.body;

    // Resolve the challenge to a user.  An unknown challenge returns the same
    // neutral 401 as a throttle so we never reveal whether the id exists.
    const existing = await prisma.loginCode.findFirst({
      where: { challengeId },
    });

    if (!existing) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired challenge',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired challenge',
      });
      return;
    }

    const throttle = await checkResendThrottle(user.id);
    if (throttle === 'cooldown') {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Please wait before requesting a new code.',
      });
      return;
    }
    if (throttle === 'window_cap') {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Too many attempts. Please try again later.',
      });
      return;
    }

    const loginCodeService = new LoginCodeService(prisma);
    const resendResult = await loginCodeService.resend(challengeId);

    if (!resendResult.success) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired challenge',
      });
      return;
    }

    const mailer = new MailerService();
    await mailer.sendEmail({
      to: user.email,
      subject: 'Your login verification code',
      text: `Your verification code is: ${resendResult.code}\n\nThis code expires in 10 minutes.`,
    });

    logger.info({ userId: user.id }, 'OTP resent');

    res.status(200).json({
      message: 'A verification code has been sent to your email.',
    });
  } catch (error) {
    logger.error({ error }, 'Resend-code endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Forgot-password request schema
const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').min(1, 'Email is required'),
});

/**
 * Check whether a forgot-password request is currently throttled for `userId`.
 *
 * Cooldown (F1): the most recent PasswordResetToken row for the user must be
 * older than RESEND_COOLDOWN_MS. Window cap (F2): the count of rows created
 * within the trailing RATE_WINDOW_MS must be below RATE_WINDOW_MAX_REQUESTS.
 *
 * Returns `'cooldown' | 'window_cap' | null` where null means the request may proceed.
 */
async function checkResetThrottle(userId: string): Promise<'cooldown' | 'window_cap' | null> {
  const now = new Date();

  const latest = await prisma.passwordResetToken.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (latest && now.getTime() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return 'cooldown';
  }

  const windowStart = new Date(now.getTime() - RATE_WINDOW_MS);
  const countInWindow = await prisma.passwordResetToken.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
  });

  if (countInWindow >= RATE_WINDOW_MAX_REQUESTS) {
    return 'window_cap';
  }

  return null;
}

// Request a password-reset link (C4, F1, F2).
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Always look up the account; the response stays neutral either way (C4).
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (user) {
      const throttle = await checkResetThrottle(user.id);
      if (throttle === 'cooldown') {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please wait before requesting a new reset link.',
        });
        return;
      }
      if (throttle === 'window_cap') {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Too many attempts. Please try again later.',
        });
        return;
      }

      const resetService = new PasswordResetTokenService(prisma);
      const { rawToken } = await resetService.issue(user.id);

      const resetUrl = `${config.app.corsOrigin}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
      const mailer = new MailerService();
      await mailer.sendEmail({
        to: user.email,
        subject: 'Password reset request',
        text: `A password reset was requested for your account.\n\nReset link: ${resetUrl}\n\nThis link expires in 60 minutes and can only be used once.`,
      });

      logger.info({ userId: user.id }, 'Password reset link issued');
    }

    // Neutral confirmation regardless of whether the account exists (C4).
    res.status(200).json({
      message: 'If an account exists for this email, a reset link has been sent.',
    });
  } catch (error) {
    logger.error({ error }, 'Forgot-password endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Reset-password request schema
const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).min(1, 'Reset token is required'),
  newPassword: z.string({ required_error: 'New password is required' }).min(1, 'New password is required').max(128, 'Password too long'),
  confirmPassword: z.string({ required_error: 'Password confirmation is required' }).min(1, 'Password confirmation is required').max(128, 'Password confirmation too long'),
});

// Consume a reset link and set a new password (C2/C3/C5/C6, D1-D4).
router.post('/reset-password', validate({ body: resetPasswordSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    const authService = new AuthService();

    // D1-D4: apply the shared password policy before consuming the token.
    const policy = await validatePassword({
      newPassword,
      confirmPassword,
    });

    if (!policy.valid) {
      const firstError = Object.values(policy.errors)[0] ?? 'Invalid password';
      res.status(400).json({
        error: 'Validation Error',
        message: firstError,
      });
      return;
    }

    const resetService = new PasswordResetTokenService(prisma);
    const consumeResult = await resetService.consume(token);

    if (!consumeResult.success) {
      // C2/C3: consumed or expired tokens surface a clear 410 so the UI can
      // prompt the user to request a new link.
      res.status(410).json({
        error: 'Gone',
        message: 'This reset link has expired or already been used. Please request a new one.',
      });
      return;
    }

    const { userId } = consumeResult;

    // Hash and persist the new password.
    const passwordHash = await authService.hashPassword(newPassword);

    // C5: clear lockout counters; C6: revoke all sessions.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    logger.info({ userId }, 'Password reset completed');

    res.status(200).json({
      message: 'Password updated successfully.',
    });
  } catch (error) {
    logger.error({ error }, 'Reset-password endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Refresh — rotate the refresh token within its family and mint a new access token (E4, E7).
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;

    if (!rawToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token not provided',
      });
      return;
    }

    const authService = new AuthService();
    const result = await authService.refresh(rawToken);

    if (!result.success) {
      // Clear the invalid cookie so the client doesn't keep retrying.
      res.clearCookie('refreshToken', { path: '/', domain: config.security.cookieDomain });
      res.status(result.status).json({
        error: 'Unauthorized',
        message: result.message,
      });
      return;
    }

    const sessionUser = await buildSessionUser(result.userId);
    if (!sessionUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    // E3: set rotated refresh cookie (httpOnly, SameSite=Strict).
    res.cookie('refreshToken', result.rawRefreshToken, {
      httpOnly: true,
      secure: config.app.nodeEnv === 'production',
      sameSite: 'strict',
      domain: config.security.cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    logger.info({ userId: result.userId }, 'Refresh token rotated');

    res.status(200).json({
      accessToken: result.accessToken,
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
      user: sessionUser,
    });
  } catch (error) {
    logger.error({ error }, 'Refresh endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Logout — revoke the current session's refresh-token family and clear the cookie (E5).
router.post('/logout', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken as string | undefined;

    if (rawToken) {
      const authService = new AuthService();
      await authService.logout(rawToken);
    }

    // Clear the refresh cookie regardless of whether it was present (idempotent).
    res.clearCookie('refreshToken', { path: '/', domain: config.security.cookieDomain });

    logger.info({ userId: req.user?.userId }, 'Session ended');

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Logout endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Me — return the current user's identity, role, permissions, and preferences (T-B5/T-B7).
router.get('/me', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
      return;
    }

    const sessionUser = await buildSessionUser(userId);

    if (!sessionUser) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json(sessionUser);
  } catch (error) {
    logger.error({ error }, 'Me endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

export { router as authRouter };
