import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Use vi.hoisted so mocks are available before vi.mock factory runs
const { mockPrisma, mockArgon2 } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  },
  mockArgon2: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    verify: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = mockPrisma.user;
    role = mockPrisma.role;
  },
}));

vi.mock('argon2', () => mockArgon2);

import { AuthService } from '../../../src/services/auth.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  describe('verifyToken', () => {
    it('should return decoded payload for valid token', () => {
      const payload = { userId: '1', email: 'a@b.com', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret');
      const result = service.verifyToken(token);
      expect(result).toMatchObject(payload);
    });

    it('should return null for expired token', () => {
      const token = jwt.sign(
        { userId: '1', email: 'a@b.com', role: 'admin' },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '-1s' },
      );
      expect(service.verifyToken(token)).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(service.verifyToken('bad.token.here')).toBeNull();
    });

    it('should return null for token with wrong secret', () => {
      const token = jwt.sign({ userId: '1' }, 'wrong-secret');
      expect(service.verifyToken(token)).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should return hashed password', async () => {
      const result = await service.hashPassword('password');
      expect(result).toBe('hashed-password');
    });

    it('should throw on hash failure', async () => {
      mockArgon2.hash.mockRejectedValueOnce(new Error('hash fail'));
      await expect(service.hashPassword('password')).rejects.toThrow('Password hashing failed');
    });
  });

  describe('authenticateUser', () => {
    it('should return error when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.authenticateUser('no@user.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return error when password is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1', email: 'a@b.com', passwordHash: 'hash', role: { name: 'admin' },
      });
      mockArgon2.verify.mockResolvedValue(false);
      const result = await service.authenticateUser('a@b.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should return token on successful auth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1', email: 'a@b.com', passwordHash: 'hash', role: { name: 'admin' },
      });
      mockArgon2.verify.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.authenticateUser('a@b.com', 'correct');
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toMatchObject({ id: '1', email: 'a@b.com', role: 'admin' });
    });

    it('should handle unexpected errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('db error'));
      const result = await service.authenticateUser('a@b.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });

  describe('createUser', () => {
    it('should return error when user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com' });
      const result = await service.createUser('a@b.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });

    it('should return error when role not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);
      const result = await service.createUser('new@b.com', 'pass', 'nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should create user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: 'admin' });
      mockPrisma.user.create.mockResolvedValue({ id: 'new-1', email: 'new@b.com' });

      const result = await service.createUser('new@b.com', 'pass', 'admin');
      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({ id: 'new-1', email: 'new@b.com' });
    });

    it('should handle unexpected errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('db error'));
      const result = await service.createUser('a@b.com', 'pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe('User creation failed');
    });
  });
});
