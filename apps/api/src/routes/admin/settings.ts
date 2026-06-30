/**
 * Admin settings routes — Phase 1.
 *
 * Handles user settings endpoints under /admin/settings:
 *   - PUT /password     — change own password (D5/E6)
 *
 * Additional endpoints (photo GET/PUT/DELETE, preferences GET/PUT) are
 * added in subsequent tasks.
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';
import { AuthService } from '../../services/auth.js';
import { validatePassword } from '../../services/passwordPolicy.js';
import { config } from '../../config/env.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router: Router = Router();

// Change-password request schema (matches OpenAPI ChangePasswordRequest).
const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required')
    .max(128, 'Password too long'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(1, 'New password is required')
    .max(128, 'Password too long'),
  confirmPassword: z
    .string({ required_error: 'Password confirmation is required' })
    .min(1, 'Password confirmation is required')
    .max(128, 'Password confirmation too long'),
});

/**
 * PUT /admin/settings/password — change own password (D5/E6).
 *
 * Verifies the current password, applies the shared password policy, blocks
 * super_admin edits, revokes all other sessions, and re-mints the acting
 * session so the user stays logged in.
 */
router.put(
  '/password',
  authenticateJWT,
  validate({ body: changePasswordSchema }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userId = req.user?.userId;
      const role = req.user?.role;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      // FR-035: super_admin account cannot be edited through the panel.
      if (role === 'super_admin') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'The super_admin account cannot be modified through the admin panel.',
        });
        return;
      }

      // D1-D4/D6: apply the server-side password policy.
      const policy = await validatePassword({ newPassword, confirmPassword });
      if (!policy.valid) {
        const firstError = Object.values(policy.errors)[0] ?? 'Invalid password';
        res.status(400).json({
          error: 'Validation Error',
          message: firstError,
        });
        return;
      }

      // Resolve the acting refresh-token family from the cookie so the
      // AuthService can re-mint it after revoking all sessions (E6).
      const rawToken = req.cookies?.refreshToken as string | undefined;
      let actingFamily: string | undefined;
      if (rawToken) {
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');
        const stored = await prisma.refreshToken.findFirst({
          where: { tokenHash },
          select: { family: true },
        });
        if (stored) {
          actingFamily = stored.family;
        }
      }

      const authService = new AuthService();

      // D5: verify current password before applying the change.
      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword,
        actingFamily ?? 'replacement-family',
      );

      if (!result.success) {
        // The AuthService returns 401 for wrong current password or missing
        // user, but the OpenAPI contract groups all validation failures
        // (policy, mismatch, wrong current) under 400.
        res.status(400).json({
          error: 'Validation Error',
          message: result.message,
        });
        return;
      }

      // E6: set the re-minted refresh cookie for the acting session.
      res.cookie('refreshToken', result.rawRefreshToken, {
        httpOnly: true,
        secure: config.app.nodeEnv === 'production',
        sameSite: 'strict',
        domain: config.security.cookieDomain,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      logger.info({ userId }, 'Password changed; other sessions revoked');

      res.status(200).json({
        message: 'Password updated successfully.',
      });
    } catch (error) {
      logger.error({ error }, 'Settings password endpoint error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication service unavailable',
      });
    }
  },
);

export { router as settingsRouter };
