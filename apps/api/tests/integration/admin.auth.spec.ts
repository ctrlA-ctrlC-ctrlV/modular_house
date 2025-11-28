import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';

describe('Admin Auth Integration', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
  let validToken: string;
  let expiredToken: string;

  beforeAll(() => {
    // Generate a valid token
    validToken = jwt.sign(
      { 
        userId: 'test-admin-id', 
        email: 'admin@example.com', 
        roles: ['admin'] 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate an expired token
    expiredToken = jwt.sign(
      { 
        userId: 'test-admin-id', 
        email: 'admin@example.com', 
        roles: ['admin'] 
      },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
  });

  describe('Protected Routes Security', () => {
    // We'll use /admin/pages as the test target since we verified it's protected
    const targetRoute = '/admin/pages';

    it('should return 401 when no token is provided', async () => {
      const response = await request(app).get(targetRoute);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    });

    it('should return 401 when an invalid token is provided', async () => {
      const response = await request(app)
        .get(targetRoute)
        .set('Authorization', 'Bearer invalid-token-string');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    });

    it('should return 401 when an expired token is provided', async () => {
      const response = await request(app)
        .get(targetRoute)
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    });

    it('should return 401 when Authorization header format is incorrect', async () => {
      const response = await request(app)
        .get(targetRoute)
        .set('Authorization', `Token ${validToken}`); // Wrong prefix
      
      expect(response.status).toBe(401);
    });

    it('should allow access with a valid token', async () => {
      // Note: This might fail if the DB is empty or connection fails, 
      // but we are mainly testing the auth middleware here.
      // If it passes the auth middleware, it might return 200 or 500 (if DB fails),
      // but definitely NOT 401 or 403.
      
      const response = await request(app)
        .get(targetRoute)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
    
    it('should return 403 when user lacks required role', async () => {
      const userToken = jwt.sign(
        { 
          userId: 'test-user-id', 
          email: 'user@example.com', 
          roles: ['user'] // Not admin
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(targetRoute)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    });
  });
});
