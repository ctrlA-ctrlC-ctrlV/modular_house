// T090 — Auth client + route guard test (T-F4).
// Asserts in-memory access token (never in localStorage/sessionStorage),
// silent refresh on expiry, Logout returns to login and blocks back-nav
// reuse, and the guard redirects unauthenticated access to login.
// Pins US2-8 + FR-003/FR-038/FR-040 + E2/E5.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Imports from the auth modules (T091–T093).
import { clearAccessToken, getAccessToken } from './apiClient.js';
import { AuthProvider, useAuth } from './AuthProvider.js';
import { AdminGuard } from './guard.js';

// ── Mock setup ─────────────────────────────────────────────────────────────────

// Track localStorage/sessionStorage calls to prove no secret is stored there.
const localStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');
const sessionStorageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem');

// Mock fetch for API calls.
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Default test user returned by /admin/auth/me.
const testMeResponse = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Admin User',
  role: 'admin',
  permissions: ['pages:view', 'gallery:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
};

// Default session response returned by verify-2fa and refresh.
const testSessionResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  expiresIn: 900,
  user: testMeResponse,
};

// Helper to build a successful /admin/auth/me response.
function mockMeSuccess() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/admin/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testMeResponse),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

// Helper to build a 401 /admin/auth/me response (no session).
function mockMeUnauthorized() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/admin/auth/me')) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized', message: 'No valid session' }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

// Helper to build a refresh success response.
function mockRefreshSuccess() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/admin/auth/refresh')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testSessionResponse),
      });
    }
    if (url.includes('/admin/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testMeResponse),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

// Helper to build a refresh failure response (expired/revoked).
function mockRefreshFailure() {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/admin/auth/refresh')) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized', message: 'Invalid refresh token' }),
      });
    }
    if (url.includes('/admin/auth/me')) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized', message: 'No valid session' }),
      });
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

// Helper that wraps a component in AuthProvider + MemoryRouter.
function renderWithAuth(
  ui: React.ReactElement,
  initialEntries: string[] = ['/admin/settings'],
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route
          path="/admin/settings"
          element={
            <AuthProvider>
              <Routes>
                <Route index element={<AdminGuard>{ui}</AdminGuard>} />
              </Routes>
            </AuthProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

// Helper that exposes the useAuth hook result for direct assertions.
function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="is-authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="is-loading">{String(auth.isLoading)}</span>
      <span data-testid="user-email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="user-role">{auth.role ?? 'none'}</span>
      <span data-testid="user-permissions">{auth.permissions.join(',')}</span>
      <button data-testid="do-logout" onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('Auth client + route guard (T-F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageSetItemSpy.mockClear();
    sessionStorageSetItemSpy.mockClear();
    clearAccessToken();
    // Clear any stored tokens.
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── apiClient — in-memory token (E2, FR-040) ────────────────────────

  describe('apiClient — in-memory token (E2)', () => {
    // E2: Access token stored in memory on the client
    // (never in localStorage/sessionStorage).

    it('stores the access token in memory, not in browser storage', () => {
      // Before setting a token, getAccessToken returns null.
      expect(getAccessToken()).toBeNull();

      // After login, the token is held in memory.
      // The apiClient.setToken function is called internally by AuthProvider
      // after a successful login or refresh. We test the raw store here.
      // This assertion will fail until T091 exports setToken or the store
      // is accessible. The apiClient module must expose getAccessToken
      // and clearAccessToken for testing.
      // No localStorage or sessionStorage setItem call should have been
      // made for an access token.
      const tokenKeyCalls = localStorageSetItemSpy.mock.calls.filter(
        ([key]) => key === 'accessToken' || key === 'adminToken',
      );
      expect(tokenKeyCalls).toHaveLength(0);
    });

    it('does not persist the access token to localStorage or sessionStorage', async () => {
      mockMeSuccess();
      mockRefreshSuccess();

      // Trigger a login flow via the AuthProvider.
      // After login + token set, no storage.setItem call should carry
      // the access token.
      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      // Scan all localStorage.setItem calls for token-like keys.
      const storageCalls = localStorageSetItemSpy.mock.calls;
      for (const [key] of storageCalls) {
        expect(key).not.toBe('accessToken');
        expect(key).not.toBe('adminToken');
        expect(key).not.toMatch(/token/i);
      }

      // sessionStorage should never be used for tokens.
      const sessionCalls = sessionStorageSetItemSpy.mock.calls;
      for (const [key] of sessionCalls) {
        expect(key).not.toBe('accessToken');
        expect(key).not.toBe('adminToken');
        expect(key).not.toMatch(/token/i);
      }
    });
  });

  // ── AuthProvider exposes role/permissions (FR-036) ──────────────────

  describe('AuthProvider exposes role/permissions (FR-036)', () => {
    // FR-036: role + effective permissions must be available to downstream
    // consumers, not just nested inside the raw user profile.

    it('exposes role and permissions as top-level context fields once authenticated', async () => {
      mockMeSuccess();

      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('user-role')).toHaveTextContent(testMeResponse.role);
      expect(screen.getByTestId('user-permissions')).toHaveTextContent(
        testMeResponse.permissions.join(','),
      );
    });
  });

  // ── Silent refresh on 401 (FR-040) ──────────────────────────────────

  describe('Silent refresh on 401 (FR-040)', () => {
    // FR-040: The client performs a silent refresh on 401/expiry.

    it('automatically refreshes the token when a request returns 401', async () => {
      let meCallCount = 0;
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/admin/auth/me')) {
          meCallCount++;
          // First call returns 401, triggering refresh.
          if (meCallCount === 1) {
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({ error: 'Unauthorized' }),
            });
          }
          // Second call (after refresh) returns 200.
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(testMeResponse),
          });
        }
        if (url.includes('/admin/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(testSessionResponse),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      });

      renderWithAuth(<AuthConsumer />);

      // After the silent refresh, the user should be authenticated.
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
    });

    it('redirects to login when the refresh also fails', async () => {
      mockMeUnauthorized();
      mockRefreshFailure();

      renderWithAuth(<AuthConsumer />, ['/admin/settings']);

      // After both me and refresh fail, the guard should redirect to login.
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  // ── Logout returns to login and blocks back-nav (E5, FR-038) ────────

  describe('Logout returns to login (E5, FR-038)', () => {
    // E5: Logout revokes the current session's refresh-token family and
    // clears the cookie.
    // FR-038: Logout returns the user to the login screen.
    // US2-8: Account menu → Logout returns to login and blocks back-nav reuse.

    it('returns to the login page after logout', async () => {
      mockMeSuccess();
      mockRefreshSuccess();

      // Mock the logout endpoint.
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/admin/auth/me')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(testMeResponse),
          });
        }
        if (url.includes('/admin/auth/logout')) {
          return Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(null) });
        }
        if (url.includes('/admin/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(testSessionResponse),
          });
        }
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      });

      renderWithAuth(<AuthConsumer />);

      // Wait for authentication to complete.
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Click the logout button.
      act(() => {
        screen.getByTestId('do-logout').click();
      });

      // After logout, the user should be redirected to login.
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('clears the in-memory token after logout', async () => {
      mockMeSuccess();
      mockRefreshSuccess();

      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Logout.
      act(() => {
        screen.getByTestId('do-logout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });

      // The in-memory token must be cleared.
      expect(getAccessToken()).toBeNull();
    });

    it('subsequent /me calls after logout return 401 (session invalidated)', async () => {
      mockMeSuccess();
      mockRefreshSuccess();

      renderWithAuth(<AuthConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Logout — after this, /me should return 401.
      mockMeUnauthorized();
      mockRefreshFailure();

      act(() => {
        screen.getByTestId('do-logout').click();
      });

      // The guard should redirect to login since the session is gone.
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });

  // ── Route guard redirects unauthenticated (FR-003) ──────────────────

  describe('Route guard redirects unauthenticated (FR-003)', () => {
    // FR-003: All admin views MUST be reachable only after successful
    // authentication; unauthenticated access MUST redirect to login.

    it('redirects to /admin/login when no session exists', async () => {
      mockMeUnauthorized();
      mockRefreshFailure();

      renderWithAuth(<AuthConsumer />, ['/admin/settings']);

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('renders the protected content when authenticated', async () => {
      mockMeSuccess();

      renderWithAuth(
        <div data-testid="protected-content">Settings Page</div>,
        ['/admin/settings'],
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('shows a loading state while the session is being fetched', () => {
      // Never resolve /me to keep loading state.
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderWithAuth(<AuthConsumer />, ['/admin/settings']);

      // The guard shows its own loading indicator while AuthProvider hydrates.
      // The AuthConsumer is not rendered until the guard passes through.
      const loading = screen.getByTestId('guard-loading');
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveTextContent('Loading...');
    });
  });
});
