import { Router, Request, Response } from 'express';
import { createHash } from 'node:crypto';
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
import { AuditLogService, AUDIT_ACTIONS, type AuditLogInput } from '../../services/auditLog.js';
import { config } from '../../config/env.js';
import {
  ACCESS_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
} from '../../config/adminAuth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reused audit-log writer (T016).  Shares the module-level Prisma client so
// audit writes do not open an extra connection pool.
const auditLogService = new AuditLogService(prisma);

const router: Router = Router();

// Apply the auth-route IP rate limit to every endpoint under /admin/auth (F4).
router.use(authRateLimit);

/**
 * Persist a single audit event (I1) without letting a write failure alter the
 * HTTP response — audit logging is best-effort relative to the request outcome
 * (FR-037).  A `null` userId is silently skipped by AuditLogService itself
 * because the reused AuditLog table requires a non-null FK (I2, unknown email).
 * Only action/entity/id metadata is ever passed; secrets are excluded (I3).
 */
async function recordAudit(input: AuditLogInput): Promise<void> {
  try {
    await auditLogService.log(input);
  } catch (error) {
    logger.error({ error, action: input.action }, 'Audit log write failed');
  }
}

// Login request schema
const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').min(1, 'Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(128, 'Password too long'),
});

// Step 1 — verify credentials and issue a one-time code (no session yet).
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const authService = new AuthService();

    // Request metadata sourced once for both success/failure audit branches (I2).
    const ipAddress = req.ip ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? null;

    // verifyCredentials loads the user row once and returns its id on every
    // branch (null only for unknown email, per I2).  Reusing that id avoids a
    // duplicate email lookup in the route — the service is the single source
    // of truth for user resolution, and AuditLogService skips the write on a
    // null userId (non-null FK constraint on the reused AuditLog table).
    const result = await authService.verifyCredentials(normalizedEmail, password);

    if (!result.success) {
      // LOGIN_FAILURE — recorded for known-account failures (wrong password,
      // deactivated, locked).  Skipped silently for unknown email (null userId).
      await recordAudit({
        userId: result.userId,
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        entity: 'user',
        ipAddress,
        userAgent,
      });

      res.status(result.status).json({
        error: result.status === 423 ? 'Locked' : 'Unauthorized',
        message: result.message,
      });
      return;
    }

    // Credentials verified — record the successful login and the OTP issuance
    // (I1: LOGIN_SUCCESS and OTP_ISSUED both occur at this step).
    await recordAudit({
      userId: result.userId,
      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      entity: 'user',
      ipAddress,
      userAgent,
    });
    await recordAudit({
      userId: result.userId,
      action: AUDIT_ACTIONS.OTP_ISSUED,
      entity: 'user',
      ipAddress,
      userAgent,
    });

    logger.info({ email: normalizedEmail }, 'Credentials verified; OTP issued');

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

    // OTP_VERIFIED — recorded only on successful verification (I1).
    await recordAudit({
      userId: result.userId,
      action: AUDIT_ACTIONS.OTP_VERIFIED,
      entity: 'user',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? null,
    });

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

// Resend a one-time code for an existing challenge (B6, B9, F1, F2).
// The 60s cooldown + 5/15m window cap are derived from LoginCode `created_at`
// rows by LoginCodeService.checkResendThrottle (T115).  A throttled request
// returns a neutral 429 and surfaces the remaining cooldown via the standard
// `Retry-After` header so the UI can render a countdown (FR-042); the body
// stays the contract `Error` schema.  The challengeId is opaque (B9), so a 429
// here never reveals account existence (unlike forgot-password — see below).
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

    // F1/F2: cooldown + rolling-window cap derived from created_at rows.
    const loginCodeService = new LoginCodeService(prisma);
    const throttle = await loginCodeService.checkResendThrottle(user.id);
    if (throttle.throttled) {
      // Surface countdown data to the UI via Retry-After (seconds, HTTP standard).
      const retryAfterSec = Math.ceil((throttle.retryAfterMs ?? RESEND_COOLDOWN_MS) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: 'Too many requests',
        message:
          throttle.reason === 'cooldown'
            ? 'Please wait before requesting a new code.'
            : 'Too many attempts. Please try again later.',
      });
      return;
    }

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

    // OTP_ISSUED — a new code was generated and emailed for an existing challenge (I1).
    await recordAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.OTP_ISSUED,
      entity: 'user',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? null,
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

// Request a password-reset link (C4, F1, F2, F3).
//
// F3 neutrality: the throttle response NEVER reveals account existence.  Because
// throttle state is derived from PasswordResetToken `created_at` rows (plan §2.6
// — no separate counter store) and rows only exist for KNOWN accounts, a 429
// could only ever fire for known emails — leaking existence versus the unknown
// 200.  The hardened behavior therefore ALWAYS returns the neutral 200: when a
// known account is throttled (cooldown / window cap) the route silently skips
// issuance + email + audit (F1: "issues/sends nothing") but still returns the
// identical neutral 200.  An unknown email is never throttled (no rows) and also
// returns the neutral 200 with no issuance.  All three paths are byte-identical.
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
      const resetService = new PasswordResetTokenService(prisma);
      // F1/F2: cooldown + rolling-window cap derived from created_at rows.
      const throttle = await resetService.checkResetThrottle(user.id);

      // Only issue + email + audit when the account is NOT throttled.  When
      // throttled, silently skip (F1 "issues/sends nothing") and fall through to
      // the neutral 200 below (F3 — no status/body difference from non-throttled
      // or unknown-email paths).
      if (!throttle.throttled) {
        const { rawToken } = await resetService.issue(user.id);

        const resetUrl = `${config.app.corsOrigin}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
        const mailer = new MailerService();
        await mailer.sendEmail({
          to: user.email,
          subject: 'Password reset request',
          text: `A password reset was requested for your account.\n\nReset link: ${resetUrl}\n\nThis link expires in 60 minutes and can only be used once.`,
        });

        // PASSWORD_RESET_REQUESTED — only for a known, non-throttled account so
        // the audit trail never leaks account existence via timing or row
        // presence (I1), and never records a throttled no-op request.
        await recordAudit({
          userId: user.id,
          action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
          entity: 'user',
          ipAddress: req.ip ?? 'unknown',
          userAgent: req.headers['user-agent'] ?? null,
        });

        logger.info({ userId: user.id }, 'Password reset link issued');
      }
    }

    // Neutral confirmation regardless of account existence or throttle state
    // (C4/F3).  This is the ONLY response status/body the route ever returns.
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

    // Look up the reset token to get the userId before consuming it,
    // so a policy violation (D6) does not waste the single-use token.
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tokenRow = await prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      select: { userId: true, consumedAt: true, expiresAt: true },
    });

    // If the token is invalid or expired, reject early without
    // revealing which condition failed (C2/C3).
    if (!tokenRow || tokenRow.consumedAt || tokenRow.expiresAt < new Date()) {
      res.status(410).json({
        error: 'Gone',
        message: 'This reset link has expired or already been used. Please request a new one.',
      });
      return;
    }

    // Load the user's current password hash so D3 can be enforced.
    const targetUser = await prisma.user.findUnique({
      where: { id: tokenRow.userId },
      select: { passwordHash: true },
    });

    // D1-D4: apply the shared password policy (D3 enforced when current hash available).
    const authService = new AuthService();
    const policy = await validatePassword({
      newPassword,
      confirmPassword,
      currentPasswordHash: targetUser?.passwordHash,
    });

    if (!policy.valid) {
      const firstError = Object.values(policy.errors)[0] ?? 'Invalid password';
      res.status(400).json({
        error: 'Validation Error',
        message: firstError,
      });
      return;
    }

    // Policy passed — now consume the token atomically. If another
    // concurrent request consumed it first, reject with 410.
    const resetService = new PasswordResetTokenService(prisma);
    const consumeResult = await resetService.consume(token);

    if (!consumeResult.success) {
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

    // PASSWORD_RESET_COMPLETED — the reset link was consumed and the new
    // password persisted (I1).  Only action/entity/id metadata is recorded (I3).
    await recordAudit({
      userId,
      action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      entity: 'user',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? null,
    });

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

    // LOGOUT — the acting user is resolved from the access token (authenticateJWT).
    await recordAudit({
      userId: req.user?.userId ?? null,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: 'user',
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? null,
    });

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
