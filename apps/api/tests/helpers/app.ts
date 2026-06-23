/**
 * Supertest app bootstrap for admin Phase 1 integration tests.
 *
 * Exports the Express `Application` instance and a factory that returns a
 * pre-bound supertest agent.  Integration tests can do:
 *
 *   import { makeAgent } from '../helpers/app.js';
 *   const req = makeAgent();
 *   const res = await req.post('/admin/auth/login').send({ ... });
 *
 * Create a fresh agent per describe-block or per test to avoid cookie bleed-over.
 */

import request from 'supertest';
import app from '../../src/app.js';

export { app };

/** Returns a new supertest request factory bound to the app. */
export function makeAgent(): ReturnType<typeof request> {
  return request(app);
}
