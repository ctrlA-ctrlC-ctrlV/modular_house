import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { requirePermission } from '../../src/middleware/requirePermission.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReq(overrides: Partial<Request> = {}): Partial<Request> {
  return { ip: '127.0.0.1', ...overrides };
}

function makeRes(): Partial<Response> {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

function userWith(permissions: string[]): NonNullable<Request['user']> {
  return { userId: 'user-1', email: 'admin@example.com', role: 'admin', permissions };
}

// ---------------------------------------------------------------------------
// Tests — FR-036, research R5
// ---------------------------------------------------------------------------

describe('requirePermission middleware — RBAC (FR-036)', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
  });

  // -------------------------------------------------------------------------
  // Allow: matching permission present
  // -------------------------------------------------------------------------

  it('calls next() when the user has the required permission', () => {
    const req = makeReq({ user: userWith(['submissions:read']) });
    const res = makeRes();

    requirePermission('submissions', 'read')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when the user has multiple permissions including the required one', () => {
    const req = makeReq({
      user: userWith(['submissions:read', 'submissions:export', 'settings:read']),
    });
    const res = makeRes();

    requirePermission('submissions', 'export')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // -------------------------------------------------------------------------
  // Deny: permission absent → 403
  // -------------------------------------------------------------------------

  it('returns 403 when the user does NOT have the required permission', () => {
    const req = makeReq({ user: userWith(['submissions:read']) });
    const res = makeRes();

    requirePermission('submissions', 'export')(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Forbidden' }),
    );
  });

  it('returns 403 when the user has an empty permissions array', () => {
    const req = makeReq({ user: userWith([]) });
    const res = makeRes();

    requirePermission('submissions', 'read')(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when resource matches but action does not', () => {
    const req = makeReq({ user: userWith(['submissions:read']) });
    const res = makeRes();

    requirePermission('submissions', 'delete')(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when action matches but resource does not', () => {
    const req = makeReq({ user: userWith(['pages:read']) });
    const res = makeRes();

    requirePermission('submissions', 'read')(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  // -------------------------------------------------------------------------
  // Unauthenticated: no req.user → 401
  // -------------------------------------------------------------------------

  it('returns 401 when req.user is not set (unauthenticated)', () => {
    const req = makeReq({ user: undefined });
    const res = makeRes();

    requirePermission('submissions', 'read')(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
    );
  });

  // -------------------------------------------------------------------------
  // Open-Closed: applying middleware to different (resource, action) pairs
  //   never requires changing route code — just pass different args
  // -------------------------------------------------------------------------

  it('returns a middleware factory (function) that returns a function', () => {
    const mw = requirePermission('settings', 'read');
    expect(typeof mw).toBe('function');
  });

  it('different resource:action pairs are checked independently', () => {
    const req1 = makeReq({ user: userWith(['settings:read']) });
    const req2 = makeReq({ user: userWith(['settings:read']) });
    const res1 = makeRes();
    const res2 = makeRes();
    const next1 = vi.fn();
    const next2 = vi.fn();

    requirePermission('settings', 'read')(req1 as Request, res1 as Response, next1);
    requirePermission('settings', 'write')(req2 as Request, res2 as Response, next2);

    expect(next1).toHaveBeenCalledOnce();
    expect(next2).not.toHaveBeenCalled();
  });
});
