import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app.js';
import { AuthService } from '../../src/services/auth.js';

const prisma = new PrismaClient();
const authService = new AuthService();

describe('Admin Auth Endpoints', () => {
  const testUser = {
    email: 'admin@test.com',
    password: 'testPassword123!',
  };

  beforeAll(async () => {
    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create a test admin user
    await authService.createUser(testUser.email, testUser.password, ['admin']);
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await prisma.$disconnect();
  });

  describe('POST /admin/auth/login', () => {
    it('should authenticate valid credentials', async () => {
      const response = await request(app)
        .post('/admin/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.roles).toContain('admin');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/admin/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/admin/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongPassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/admin/auth/login')
        .send({
          email: testUser.email,
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password is required',
          }),
        ])
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/admin/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation Error');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format',
          }),
        ])
      );
    });
  });

  describe('POST /admin/auth/logout', () => {
    it('should accept logout request with valid token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/admin/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const token = loginResponse.body.token;

      // Then logout with the token
      await request(app)
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });

    it('should accept logout request without token', async () => {
      await request(app)
        .post('/admin/auth/logout')
        .expect(204);
    });
  });
});

describe('AuthService', () => {
  const testEmail = 'service-test@test.com';
  const testPassword = 'testPassword123!';

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const result = await authService.createUser(testEmail, testPassword);

      expect(result.success).toBe(true);
      expect(result.user).toHaveProperty('id');
      expect(result.user?.email).toBe(testEmail);

      // Verify user was created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe(testEmail);
      expect(dbUser?.passwordHash).not.toBe(testPassword); // Should be hashed
      expect(dbUser?.roles).toEqual(['admin']);
    });

    it('should not create duplicate users', async () => {
      // First creation should succeed
      const firstResult = await authService.createUser(testEmail + '2', testPassword);
      expect(firstResult.success).toBe(true);

      // Second creation with same email should fail
      const secondResult = await authService.createUser(testEmail + '2', testPassword);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toBe('User already exists');
    });
  });

  describe('authenticateUser', () => {
    beforeAll(async () => {
      await authService.createUser(testEmail + '3', testPassword);
    });

    it('should authenticate valid credentials', async () => {
      const result = await authService.authenticateUser(testEmail + '3', testPassword);

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
      expect(result.user).toHaveProperty('id');
      expect(result.user?.email).toBe(testEmail + '3');
    });

    it('should reject invalid password', async () => {
      const result = await authService.authenticateUser(testEmail + '3', 'wrongPassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.token).toBeUndefined();
    });

    it('should reject nonexistent user', async () => {
      const result = await authService.authenticateUser('nonexistent@test.com', testPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      // First create and authenticate user
      await authService.createUser(testEmail + '4', testPassword);
      const authResult = await authService.authenticateUser(testEmail + '4', testPassword);
      
      expect(authResult.success).toBe(true);
      const token = authResult.token!;

      // Then verify the token
      const decoded = authService.verifyToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.email).toBe(testEmail + '4');
      expect(decoded?.roles).toEqual(['admin']);
    });

    it('should reject invalid token', async () => {
      const decoded = authService.verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });
  });
});