// T097 — Legacy admin fully removed (regression).
// Complements the T028 endpoint re-gating tests by asserting, from the
// frontend side, that FR-001/SC-007/DoD-4 hold: no `adminToken` browser-
// storage reference remains in any non-test source file, the legacy admin
// route components deleted in T011 are absent from disk, and no legacy
// admin route resolves in the SPA router (unauthenticated /admin lands on
// the new login page, never the old dashboard).
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';

// Mock fetch so /admin/auth/me resolves deterministically to "unauthenticated"
// for every test in this file — AdminGuard must redirect to /admin/login
// rather than hang on a real network call in the jsdom test environment.
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: 'Unauthorized', message: 'No valid session' }),
  }),
);
vi.stubGlobal('fetch', mockFetch);

// Raw contents of every non-test TypeScript/JavaScript file under
// apps/web/src, keyed by module path. `import.meta.glob` (Vite's build-time
// file enumeration, typed via the `vite/client` reference already in
// tsconfig.json) is used instead of `node:fs` because this app's
// browser-targeted tsconfig has no Node type declarations. `__tests__`
// directories are excluded because they legitimately assert the *absence*
// of the `adminToken` string as a string literal, which would otherwise
// register as a false-positive match.
const productionSourceModules = import.meta.glob(
  ['/src/**/*.{ts,tsx,js,jsx}', '!/src/**/*.test.{ts,tsx,js,jsx}', '!/src/**/__tests__/**'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

// Every module path under /src/routes/admin/** — empty once the legacy
// directory (deleted in T011) is fully removed.
const legacyRouteAdminModules = import.meta.glob('/src/routes/admin/**/*.{ts,tsx}', {
  eager: true,
});

describe('Legacy admin fully removed (regression, T097)', () => {
  // ── No adminToken storage references remain (FR-001, SC-007) ────────

  describe('No adminToken storage references in production source', () => {
    it('contains no "adminToken" string in any non-test file under apps/web/src', () => {
      const offenders = Object.entries(productionSourceModules)
        .filter(([, contents]) => contents.includes('adminToken'))
        .map(([path]) => path);
      expect(offenders).toEqual([]);
    });
  });

  // ── Legacy admin route files are absent (T011, DoD-4) ────────────────

  describe('Legacy admin route files are absent', () => {
    it('src/routes/admin/ no longer contains any file (login, index, guard, and legacy CRUD pages all deleted)', () => {
      expect(Object.keys(legacyRouteAdminModules)).toEqual([]);
    });
  });

  // ── No legacy admin route resolves in the SPA router (FR-001, FR-003) ─

  describe('No legacy admin route resolves in the SPA router', () => {
    function renderAdminRoute(route: string) {
      return render(
        <HelmetProvider>
          <MemoryRouter initialEntries={[route]}>
            <App />
          </MemoryRouter>
        </HelmetProvider>,
      );
    }

    it('renders the new login page (not a legacy dashboard) at /admin', async () => {
      renderAdminRoute('/admin');

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('renders the new login page directly at /admin/login with no Google option', () => {
      renderAdminRoute('/admin/login');

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /google/i })).toBeNull();
    });

    it('redirects an unmatched /admin/* path into the guarded layer, not a public 404', async () => {
      renderAdminRoute('/admin/some-legacy-page');

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });
  });
});
