import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Define mock function using vi.hoisted to handle hoisting
const { verifyTokenMock } = vi.hoisted(() => {
  return { verifyTokenMock: vi.fn() };
});

// Mock AuthService
vi.mock('../../../src/services/auth.js', () => {
  return {
    AuthService: class {
      verifyToken = verifyTokenMock;
    },
  };
});

import { authenticateJWT, requireRole } from '../../../src/middleware/auth.js';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFunction = vi.fn();
    
    // Reset mock
    vi.clearAllMocks();
  });

  describe('authenticateJWT', () => {
    it('should call next() if token is valid', () => {
      const token = 'valid.token';
      const decoded = { userId: '1', email: 'test@test.com', roles: ['admin'] };
      
      mockRequest.headers = { authorization: `Bearer ${token}` };
      verifyTokenMock.mockReturnValue(decoded);

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(verifyTokenMock).toHaveBeenCalledWith(token);
      expect((mockRequest as any).user).toEqual(decoded);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', () => {
      mockRequest.headers = {};

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized',
        message: 'Authentication required'
      }));
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid.token' };
      verifyTokenMock.mockReturnValue(null);

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      }));
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if auth header format is wrong', () => {
      mockRequest.headers = { authorization: 'Basic token' };

      authenticateJWT(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next() if user has required role', () => {
      (mockRequest as any).user = { roles: ['admin', 'editor'] };
      
      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      (mockRequest as any).user = { roles: ['editor'] };
      
      const middleware = requireRole('admin');
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forbidden'
      }));
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
