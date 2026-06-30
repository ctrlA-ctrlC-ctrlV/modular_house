/**
 * Admin settings routes — Phase 1.
 *
 * Handles user settings endpoints under /admin/settings:
 *   - PUT /password     — change own password (D5/E6)
 *   - PUT /photo        — upload or replace the profile photo (G1–G3)
 *   - GET /photo        — retrieve the profile photo bytes (G5/G6)
 *
 * Additional endpoints (photo DELETE, preferences GET/PUT) are
 * added in subsequent tasks.
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { authenticateJWT } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';
import { AuthService } from '../../services/auth.js';
import { validatePassword } from '../../services/passwordPolicy.js';
import { config } from '../../config/env.js';
import { PrismaClient } from '@prisma/client';
import {
  PHOTO_MAX_BYTES,
  PHOTO_ACCEPTED_MIME_TYPES,
} from '../../config/adminAuth.js';

const prisma = new PrismaClient();
const router: Router = Router();

/**
 * Multer memory-storage middleware for profile-photo uploads.
 * Files are held in memory as Buffers (not written to disk) so they can
 * be persisted directly to the database `User.profilePhoto` column.
 * The 6 MB multer limit gives headroom above the 5 MB policy check (G2)
 * so the route handler can return a clean 400 rather than a multer error.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_BYTES + 1024 * 1024 },
});

/**
 * Build the Me-shaped user payload from a fully-loaded user row.
 *
 * Mirrors the `Me` schema in the admin-auth OpenAPI contract:
 * id, email, displayName, role, permissions, hasProfilePhoto, isSuperAdmin, preferences.
 * Duplicated from auth.ts to avoid cross-module coupling (Open-Closed).
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

/**
 * PUT /admin/settings/photo — upload or replace the profile photo (G1–G3).
 *
 * Accepts a single multipart file named `photo`.  Validates MIME type
 * (image/png, image/jpeg, image/webp) and file size (≤ 5 MB).  Persists
 * the raw bytes and MIME type on the `User` row.  Blocks super_admin (FR-035).
 * Returns the `Me`-shaped user payload with `hasProfilePhoto: true`.
 */
router.put(
  '/photo',
  authenticateJWT,
  upload.single('photo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
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

      // Multer places the parsed file on req.file; absence means no file
      // was provided in the multipart body.
      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'No photo file provided.',
        });
        return;
      }

      // G3: validate MIME type against the accepted set.
      if (
        !PHOTO_ACCEPTED_MIME_TYPES.includes(
          file.mimetype as (typeof PHOTO_ACCEPTED_MIME_TYPES)[number],
        )
      ) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Unsupported image type "${file.mimetype}". Accepted types: ${PHOTO_ACCEPTED_MIME_TYPES.join(', ')}.`,
        });
        return;
      }

      // G2: validate file size against the 5 MB cap.
      if (file.size > PHOTO_MAX_BYTES) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Photo exceeds the maximum size of ${PHOTO_MAX_BYTES / (1024 * 1024)} MB.`,
        });
        return;
      }

      // Persist the raw image bytes and MIME type on the User row.
      await prisma.user.update({
        where: { id: userId },
        data: {
          profilePhoto: file.buffer,
          profilePhotoMime: file.mimetype,
        },
      });

      // Build and return the Me-shaped response so the client can
      // update hasProfilePhoto without a separate /me round-trip.
      const me = await buildSessionUser(userId);
      if (!me) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      logger.info({ userId }, 'Profile photo updated');
      res.status(200).json(me);
    } catch (error) {
      logger.error({ error }, 'Settings photo PUT endpoint error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unable to update profile photo',
      });
    }
  },
);

/**
 * GET /admin/settings/photo — retrieve the authenticated user's profile photo.
 *
 * Returns the stored image bytes with the correct Content-Type header.
 * Responds with 404 when no photo is set (the client renders the initials
 * fallback per G4/G6).
 */
router.get(
  '/photo',
  authenticateJWT,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      // Load only the photo columns to minimise transfer.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePhoto: true, profilePhotoMime: true },
      });

      if (!user || !user.profilePhoto || !user.profilePhotoMime) {
        res.status(404).json({
          error: 'Not Found',
          message: 'No profile photo set.',
        });
        return;
      }

      // Stream the stored bytes with the correct MIME type.
      res.setHeader('Content-Type', user.profilePhotoMime);
      res.setHeader('Content-Length', user.profilePhoto.length);
      res.status(200).send(user.profilePhoto);
    } catch (error) {
      logger.error({ error }, 'Settings photo GET endpoint error');
      res.status(500).json({
        error: 'Internal server error',
        message: 'Unable to retrieve profile photo',
      });
    }
  },
);

export { router as settingsRouter };
