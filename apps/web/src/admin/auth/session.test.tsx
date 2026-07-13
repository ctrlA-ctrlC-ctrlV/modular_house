// T119 — E-SESSION: session/refresh edge tests (frontend).
//
// Asserts client-side E2/E4/E5 boundary behaviour:
//
//   E2 — Silent refresh on access-token expiry mid-use: the new token is
//        stored in memory only, never written to localStorage/sessionStorage,
//        and the retried request receives the successful response.
//
//   E4 — When the refresh endpoint returns 401 (entire family revoked by
//        reuse-detection), the apiClient clears the in-memory token and
//        returns the 401 to the caller rather than retrying indefinitely.
//
//   E5 — A protected view with an absent or expired session redirects to
//        /admin/login; the in-memory token is null after the session ends.
//
// These tests operate at the apiClient level (E2/E4) and at the
// AuthProvider + AdminGuard integration level (E5), exercising distinct
// code paths from the existing T090 auth.test.tsx which focuses on the
// full AuthProvider lifecycle.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import {
  authenticatedFetch,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './apiClient.js';
import { AuthProvider } from './AuthProvider.js';
import { AdminGuard } from './guard.js';

// ── Mock setup ───────────────────────────────────────────────────────────────

// Spy on browser storage to assert no token keys are written there (E2).
const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
const sessionStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');

// Replace global fetch so tests never hit the network.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Shared test data ─────────────────────────────────────────────────────────

const testMeResponse = {
  id: 'user-e-session',
  email: 'session@example.com',
  displayName: 'Session User',
  role: 'admin',
  permissions: ['pages:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
};

const testSessionResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshed',
  expiresIn: 900,
  user: testMeResponse,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Wrap component in AuthProvider + MemoryRouter with a /admin/login route.
 *
 * Uses a single flat <Routes> block (no nested <Routes>) so AdminGuard's
 * <Navigate to="/admin/login"> is resolved by the same route table that
 * defines the login page — avoiding the React Router descendant-<Routes>
 * console warning.
 */
function renderWithAuth(
  ui: React.ReactElement,
  initialEntries: string[] = ['/admin/settings'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/admin/login"
          element={<div data-testid="login-page">Login Page</div>}
        />
        <Route
          path="/admin/settings"
          element={
            <AuthProvider>
              <AdminGuard>{ui}</AdminGuard>
            </AuthProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('E-SESSION — client-side session/refresh edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageSetItemSpy.mockClear();
    sessionStorageSetItemSpy.mockClear();
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── E2 — silent refresh on access-token expiry mid-use ──────────────────────

  describe('E2 — silent refresh on access-token expiry mid-use', () => {
    it(
      'retries a failed request after a silent refresh and returns the ' +
        'successful response; token remains in memory only (E2)',
      async () => {
        // Start with a stale in-memory token (simulates an expired access token
        // that the client holds after a previous session without knowing it expired).
        setAccessToken('stale-access-token');

        let protectedCallCount = 0;

        // The fetch mock simulates: first call → 401 (expired token),
        // refresh → 200 (new session), retry of original → 200 (success).
        mockFetch.mockImplementation((url: string) => {
          if (url.includes('/admin/auth/refresh')) {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(testSessionResponse),
            });
          }

          // Protected endpoint: first call with stale token → 401,
          // second call (after refresh) → 200.
          protectedCallCount++;
          if (protectedCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ error: 'Unauthorized', message: 'Token expired' }),
            });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: 'protected' }),
          });
        });

        const response = await authenticatedFetch('/admin/some-protected-endpoint');

        // The silent refresh must have succeeded and the retry must have returned 200.
        expect(response.status).toBe(200);

        // The new access token must be in memory (not null).
        expect(getAccessToken()).toBe(testSessionResponse.accessToken);

        // E2: no token key must have been written to browser storage during
        // the entire refresh + retry cycle.
        const storageCalls = [
          ...localStorageSetItemSpy.mock.calls,
          ...sessionStorageSetItemSpy.mock.calls,
        ];
        for (const [key] of storageCalls) {
          expect(key).not.toMatch(/token/i);
          expect(key).not.toBe('accessToken');
          expect(key).not.toBe('adminToken');
        }
      },
    );
  });

  // ── E4 — failed refresh clears in-memory token ──────────────────────────────

  describe('E4 — failed refresh (revoked family) clears in-memory token', () => {
    it(
      'when the refresh endpoint returns 401 (e.g. full-family revocation), ' +
        'the in-memory token is cleared and the 401 is returned to the caller (E4)',
      async () => {
        // Start with an in-memory access token (held from a previous successful login).
        setAccessToken('compromised-access-token');

        // Both the protected endpoint and the refresh endpoint return 401
        // (models the scenario where the refresh token's entire family was
        // revoked server-side due to a reuse detection event per E4).
        mockFetch.mockImplementation((url: string) => {
          if (url.includes('/admin/auth/refresh')) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () =>
                Promise.resolve({ error: 'Unauthorized', message: 'Invalid refresh token' }),
            });
          }
          // Protected endpoint — returns 401 to trigger the refresh attempt.
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized', message: 'Token expired' }),
          });
        });

        const response = await authenticatedFetch('/admin/some-protected-endpoint');

        // The response must be 401 — the client did not retry after the failed refresh.
        expect(response.status).toBe(401);

        // E4: the in-memory token must be cleared after a failed refresh so
        // subsequent requests cannot attempt to use the revoked token again.
        expect(getAccessToken()).toBeNull();
      },
    );
  });

  // ── E5 — protected view redirects when session is absent/expired ─────────────

  describe('E5 — protected view redirects to login when session is absent', () => {
    it(
      'redirects to /admin/login when both /me and the refresh endpoint ' +
        'return 401 (session absent or fully expired) (E5)',
      async () => {
        // No in-memory token (no prior login this page load) — E2 guarantee
        // means the access token is null by default here (cleared in beforeEach).

        // Both /me and /refresh return 401 (no valid session exists).
        mockFetch.mockImplementation((url: string) => {
          if (url.includes('/admin/auth/refresh')) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () =>
                Promise.resolve({ error: 'Unauthorized', message: 'Invalid refresh token' }),
            });
          }
          if (url.includes('/admin/auth/me')) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () =>
                Promise.resolve({ error: 'Unauthorized', message: 'No valid session' }),
            });
          }
          return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        });

        renderWithAuth(
          <div data-testid="protected-content">Protected Settings Page</div>,
          ['/admin/settings'],
        );

        // The AdminGuard must redirect to /admin/login once the AuthProvider
        // finishes hydrating and determines there is no valid session (E5 + FR-003).
        await waitFor(() => {
          expect(screen.getByTestId('login-page')).toBeInTheDocument();
        });

        // The protected content must never have been rendered.
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

        // E2: in-memory token must remain null — no token was stored anywhere.
        expect(getAccessToken()).toBeNull();
      },
    );
  });
});
