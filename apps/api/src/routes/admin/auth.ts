import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';
import { authRateLimit } from '../../middleware/rateLimit.js';
import { AuthService } from '../../services/auth.js';

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

// Logout — revokes the current session (stub: full refresh-token revocation comes in T047).
router.post('/logout', (_req: Request, res: Response): void => {
  res.status(204).send();
});

export { router as authRouter };
