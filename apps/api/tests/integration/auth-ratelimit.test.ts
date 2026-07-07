/**
 * T034 — Auth-route IP rate-limit integration test.
 *
 * Asserts that the auth routes share a per-IP rate limit with the F4 default
 * (20 requests / 15 minutes / IP) and that the 429 response is neutral.
 *
 * A unique forwarded IP is used so this test is isolated from any other
 * auth-route traffic in the same process.
 */
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { IP_RATE_LIMIT_MAX } from '../../src/config/adminAuth.js';

describe('Auth-route IP rate limit (F4)', () => {
  // Use a unique synthetic IP so the in-memory rate-limit store does not
  // carry state from other tests/files.
  const uniqueIp = '198.51.100.42';

  afterAll(async () => {
    // Allow the in-memory rate-limit window to expire naturally between runs.
    // 15 minutes is too long to wait, but a short pause lets any pending
    // async middleware complete before the process exits.
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it('returns 429 after IP_RATE_LIMIT_MAX requests to auth routes', async () => {
    // Consume the full per-IP budget with lightweight invalid payloads
    // (validation failures are fast and do not hit argon2).
    for (let i = 0; i < IP_RATE_LIMIT_MAX; i++) {
      const res = await request(app)
        .post('/admin/auth/login')
        .set('X-Forwarded-For', uniqueIp)
        .send({});

      // Either validation error (400) or rate-limit (429) is acceptable.
      expect([400, 429]).toContain(res.status);

      if (res.status === 429) {
        // If the limit is already reached before the budget is exhausted,
        // something else consumed counts for this IP; fail loudly.
        throw new Error(`Rate limit hit early at request ${i + 1}`);
      }
    }

    // The next request from the same IP must be throttled.
    const blocked = await request(app)
      .post('/admin/auth/login')
      .set('X-Forwarded-For', uniqueIp)
      .send({ email: 'any@example.com', password: 'AnyPass1234!' });

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      error: expect.any(String),
      message: expect.any(String),
    });
    // Neutral response: must not reveal whether the email exists.
    expect(blocked.body).not.toHaveProperty('challengeId');
    expect(blocked.body).not.toHaveProperty('token');
    expect(blocked.body).not.toHaveProperty('accessToken');
  });
});
