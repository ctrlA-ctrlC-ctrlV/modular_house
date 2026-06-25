import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';

const router: Router = Router();

// Login request schema
const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').min(1, 'Email is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').max(128, 'Password too long'),
});

// Step 1 — verify credentials and issue a one-time code (no session yet).
// NOTE: this is a stub pending the full AuthService rewrite (T031).
// The OTP issuance logic will be wired in when LoginCodeService is ready (T018).
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Import AuthService here to avoid circular deps in the stub phase.
    const { AuthService } = await import('../../services/auth.js');
    const authService = new AuthService();

    const result = await authService.authenticateUser(email.toLowerCase().trim(), password);

    if (!result.success) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
      return;
    }

    logger.info({ email: email.toLowerCase().trim() }, 'Credentials verified; OTP stub issued');

    // Return the Phase 1 two-factor challenge shape (no token at this step).
    // challengeId is a placeholder until the LoginCodeService is wired in (T018).
    const { randomUUID } = await import('node:crypto');
    res.status(200).json({
      challengeId: randomUUID(),
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

// Logout — revokes the current session (stub: full refresh-token revocation comes in T031).
router.post('/logout', (_req: Request, res: Response): void => {
  res.status(204).send();
});

export { router as authRouter };
