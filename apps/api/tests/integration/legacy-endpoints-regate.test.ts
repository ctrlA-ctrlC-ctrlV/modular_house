/**
 * T028 — Retained legacy admin endpoints re-gate test (research R12, FR-036)
 *
 * Every retained feature-006 admin list/data endpoint that will be wired for Phase 2+
 * must require a matching `requirePermission` gate:
 *   - unauthenticated          → 401
 *   - authenticated, no perms  → 403
 *
 * These tests fail before T029 (re-gate implementation) because some routes only
 * use `requireRole` (which passes for role='admin' regardless of permissions) and
 * others have no role/permission check at all after `authenticateJWT`.
 *
 * JWT secret is set to 'test-jwt-secret' by apps/api/src/test/setup.ts.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

const JWT_SECRET = 'test-jwt-secret';

/** Valid JWT that carries NO permissions — simulates a user with empty RBAC grants. */
function makeNoPermToken(): string {
  return jwt.sign(
    { userId: 'test-user', email: 'user@example.com', role: 'admin', permissions: [] },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

// ---------------------------------------------------------------------------
// Retained admin list/data endpoints to re-gate
// Each entry: [description, HTTP method, path, minimum required permission]
// ---------------------------------------------------------------------------

const RETAINED_ENDPOINTS: Array<[string, 'get' | 'post', string, string]> = [
  // Pages
  ['GET /admin/pages (list)', 'get', '/admin/pages', 'pages:view'],
  // Gallery
  ['GET /admin/gallery (list)', 'get', '/admin/gallery', 'gallery:view'],
  // FAQs
  ['GET /admin/faqs (list)', 'get', '/admin/faqs', 'faqs:view'],
  // Submissions
  ['GET /admin/submissions (list)', 'get', '/admin/submissions', 'submissions:view'],
  // Redirects
  ['GET /admin/redirects (list)', 'get', '/admin/redirects', 'redirects:view'],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Retained admin endpoints — re-gate (T028)', () => {
  const noPermToken = makeNoPermToken();

  for (const [label, method, path, permission] of RETAINED_ENDPOINTS) {
    describe(label, () => {
      it('returns 401 for unauthenticated requests', async () => {
        const res = await (request(app) as ReturnType<typeof request>)[method](path);
        expect(res.status).toBe(401);
      });

      it(`returns 403 for authenticated requests without "${permission}" permission`, async () => {
        const res = await (request(app) as ReturnType<typeof request>)[method](path)
          .set('Authorization', `Bearer ${noPermToken}`);
        expect(res.status).toBe(403);
      });
    });
  }
});
