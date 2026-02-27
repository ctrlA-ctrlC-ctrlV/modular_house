import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// -------------------------------------------------------------------
// Hoist mock data so it's available when vi.mock factories run
// -------------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  role: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {
      user = mockPrisma.user;
      role = mockPrisma.role;
    },
  };
});

// Mock argon2
vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  verify: vi.fn(),
}));

import { AuthService } from '../../../src/services/auth.js';
import * as argon2 from 'argon2';

describe('AuthService (unit)', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  // =======================================================================
  // verifyToken
  // =======================================================================
  describe('verifyToken', () => {
    it('should return null for a completely malformed token', () => {
      // This exercises the JsonWebTokenError branch
      const result = authService.verifyToken('not.a.valid.jwt.token');
      expect(result).toBeNull();
    });

    it('should return null when an unexpected (non-JWT) error is thrown', () => {
      // Exercise the "else" branch in the catch — a non-JWT error type.
      // Spy on jwt.verify to throw a generic Error (not a JWT-specific error).
      const verifySpy = vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new TypeError('unexpected');
      });

      const result = authService.verifyToken('some.token.here');
      expect(result).toBeNull();

      verifySpy.mockRestore();
    });
  });

  // =======================================================================
  // createUser
  // =======================================================================
  describe('createUser', () => {
    it('should return error when role is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);

      const result = await authService.createUser('new@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe("Role 'admin' not found");
    });

    it('should return error when user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@test.com' });

      const result = await authService.createUser('existing@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });

    it('should create user successfully when role exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'admin' });
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', email: 'new@test.com' });

      const result = await authService.createUser('new@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('new@test.com');
    });

    it('should return error when prisma throws', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const result = await authService.createUser('fail@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User creation failed');
    });
  });

  // =======================================================================
  // authenticateUser
  // =======================================================================
  describe('authenticateUser', () => {
    it('should return error when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.authenticateUser('missing@test.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return error when password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        passwordHash: 'hashed',
        role: { name: 'admin' },
      });
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await authService.authenticateUser('user@test.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return token when credentials are valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'user@test.com',
        passwordHash: 'hashed',
        role: { name: 'admin' },
      });
      (argon2.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.authenticateUser('user@test.com', 'correct');

      expect(result.success).toBe(true);
      expect(result.token).toBeTruthy();
      expect(result.user?.role).toBe('admin');
    });

    it('should return error when an unexpected exception occurs', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB down'));

      const result = await authService.authenticateUser('fail@test.com', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });

  // =======================================================================
  // hashPassword
  // =======================================================================
  describe('hashPassword', () => {
    it('should return hashed password', async () => {
      const hash = await authService.hashPassword('password123');
      expect(hash).toBe('hashed-password');
    });

    it('should throw when argon2 fails', async () => {
      (argon2.hash as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('hash fail'));

      await expect(authService.hashPassword('password123')).rejects.toThrow(
        'Password hashing failed',
      );
    });
  });
});
