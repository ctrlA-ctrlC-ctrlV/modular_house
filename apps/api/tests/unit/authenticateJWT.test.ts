import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { verifyTokenMock } = vi.hoisted(() => ({
  verifyTokenMock: vi.fn(),
}));

vi.mock('../../src/services/auth.js', () => ({
  AuthService: class {
    verifyToken = verifyTokenMock;
  },
}));

// ---------------------------------------------------------------------------
// Module under test (imported after mocks)
// ---------------------------------------------------------------------------

import { authenticateJWT } from '../../src/middleware/auth.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers, ip: '127.0.0.1' };
}

function makeRes(): Partial<Response> {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests — T023: claim-loading (E1) and 401 paths
// ---------------------------------------------------------------------------

describe('authenticateJWT — claim loading (E1)', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  // -------------------------------------------------------------------------
  // E1: JWT carries userId, email, role, and effective permissions
  // -------------------------------------------------------------------------

  it('populates req.user with userId, email, role, and permissions from a valid token (E1)', () => {
    const decoded = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['submissions:read', 'submissions:export'],
    };
    verifyTokenMock.mockReturnValue(decoded);

    const req = makeReq({ authorization: 'Bearer valid.token' });
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as Request).user).toEqual(decoded);
    expect((req as Request).user!.permissions).toEqual(['submissions:read', 'submissions:export']);
  });

  it('populates req.user.permissions as an empty array when the JWT carries none', () => {
    const decoded = {
      userId: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
      permissions: [],
    };
    verifyTokenMock.mockReturnValue(decoded);

    const req = makeReq({ authorization: 'Bearer valid.token' });
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as Request).user!.permissions).toEqual([]);
  });

  it('passes all four claim fields through to req.user (userId, email, role, permissions)', () => {
    const decoded = {
      userId: 'abc-123',
      email: 'test@example.com',
      role: 'super_admin',
      permissions: ['settings:read', 'settings:write'],
    };
    verifyTokenMock.mockReturnValue(decoded);

    const req = makeReq({ authorization: 'Bearer valid.token' });
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    const user = (req as Request).user!;
    expect(user.userId).toBe('abc-123');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('super_admin');
    expect(user.permissions).toEqual(['settings:read', 'settings:write']);
  });

  // -------------------------------------------------------------------------
  // 401 paths — invalid / expired / missing token
  // -------------------------------------------------------------------------

  it('returns 401 when the token is invalid or expired', () => {
    verifyTokenMock.mockReturnValue(null);

    const req = makeReq({ authorization: 'Bearer bad.token' });
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
    );
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = makeReq({});
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when the Authorization header does not start with "Bearer "', () => {
    const req = makeReq({ authorization: 'Basic dXNlcjpwYXNz' });
    const res = makeRes();

    authenticateJWT(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
