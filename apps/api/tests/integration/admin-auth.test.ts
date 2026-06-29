/**
 * Admin Auth — Integration tests for the Phase 1 two-factor login contract (T-B1).
 *
 * Asserts the new "step-1 login = OTP issued, no token" contract.
 * Legacy "200 + token" assertions are intentionally absent — see plan §4.3 / FR-007.
 *
 * These tests run against the Express app without a real database or SMTP server;
 * the credential verification path is the existing AuthService stub.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /admin/auth/login — Phase 1 two-factor contract', () => {
  it('returns 400 when request body is missing', async () => {
    const res = await request(app).post('/admin/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'not-an-email', password: 'somepassword' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is absent', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'admin@example.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 with a generic message for unknown credentials', async () => {
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'unknown@example.com', password: 'WrongPass1234' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: 'Unauthorized',
      message: 'Invalid credentials',
    });
    // Must NOT contain a token in the error path
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('challengeId');
  });

  it('does NOT return a token on successful credential check', async () => {
    // This test will return 401 in the stub phase (no seeded DB user in integration tests).
    // It verifies the shape contract: if a 200 is returned, no token must be present.
    const res = await request(app)
      .post('/admin/auth/login')
      .send({ email: 'admin@example.com', password: 'AnyPassword123' });

    if (res.status === 200) {
      // If credentials somehow pass (e.g. seeded DB), assert the new contract shape.
      expect(res.body).toHaveProperty('challengeId');
      expect(res.body).toHaveProperty('message');
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('user');
    } else {
      // Stub / no DB: either 401 or 500 — either way, no token.
      expect(res.body).not.toHaveProperty('token');
    }
  });
});

describe('POST /admin/auth/logout', () => {
  it('returns 401 when no access token is provided', async () => {
    const res = await request(app).post('/admin/auth/logout');
    expect(res.status).toBe(401);
  });
});
