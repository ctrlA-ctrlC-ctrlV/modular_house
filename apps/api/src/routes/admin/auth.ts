import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../../services/auth.js';
import { validate } from '../../middleware/validate.js';
import { logger } from '../../middleware/logger.js';

const router: Router = Router();
const authService = new AuthService();

// Login request schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Login endpoint
router.post('/login', validate({ body: loginSchema }), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.authenticateUser(email, password);

    if (!result.success) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Authentication failed',
      });
      return;
    }

    logger.info({ 
      userId: result.user?.id, 
      email: result.user?.email 
    }, 'Admin login successful');

    res.status(200).json({
      token: result.token,
      user: {
        id: result.user?.id,
        email: result.user?.email,
        roles: result.user?.roles,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Login endpoint error');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable',
    });
  }
});

// Logout endpoint (stateless JWT - client-side logout)
router.post('/logout', (req: Request, res: Response): void => {
  // For JWT-based auth, logout is typically handled client-side
  // by removing the token from storage. We log the action for audit purposes.
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    
    if (decoded) {
      logger.info({ 
        userId: decoded.userId, 
        email: decoded.email 
      }, 'Admin logout initiated');
    }
  }

  res.status(204).send();
});

export { router as authRouter };