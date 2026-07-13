// T127 — E-A11Y/THEME accessibility + theme-flash test.
// Runs an automated axe scan against each Phase 1 surface (login, two-factor,
// password reset, shell, settings) asserting zero accessibility violations,
// spot-checks that every native button/input control carries the H4
// focus-visible ring utility, and pins H1 (no wrong-theme frame on first
// paint) at the Shell-mount integration level.
// Pins US2-6 + H1/H4/H5/H6 + FR-030/FR-031.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Login } from '../pages/Login.js';
import { TwoFactor } from '../pages/TwoFactor.js';
import { ResetPassword } from '../pages/ResetPassword.js';
import { Settings } from '../pages/Settings.js';
import { AuthProvider } from '../auth/AuthProvider.js';
import { AdminGuard } from '../auth/guard.js';
import { clearAccessToken } from '../auth/apiClient.js';
import { AppShell } from './AppShell.js';
import { applyBootTheme } from '../theme/boot.js';

expect.extend(toHaveNoViolations);

// Default authenticated user for the Shell + Settings surfaces (mirrors the
// AppShell.test.tsx / Settings.test.tsx fixtures).
const testUser = {
  id: 'user-1',
  email: 'jane@example.com',
  displayName: 'Jane Doe',
  role: 'admin',
  permissions: ['pages:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
};

// Stubs the authenticated GET /admin/auth/me and GET /admin/settings/photo
// responses consumed by the Shell and Settings surfaces. jsdom has no
// createObjectURL implementation, so URL is also stubbed (Settings.test.tsx
// / AppShell.test.tsx pattern).
const mockFetch = vi.fn((url: string, init?: Parameters<typeof fetch>[1]) => {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (url.includes('/admin/auth/me')) {
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(testUser) });
  }
  if (url.includes('/admin/settings/photo') && method === 'GET') {
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  }
  return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
});

/**
 * Overrides `window.matchMedia` so the sidebar's mobile-breakpoint detection
 * (H5; `sidebar.tsx`'s `useEffect` reading `(max-width: 767px)`) resolves to
 * the requested value. Passing `false` restores the desktop (non-matching)
 * default used by every other describe block in this file.
 */
function setMobileViewport(isMobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: isMobile && query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

/**
 * Spot-checks the H4 focus-ring utility (`focus-visible:ring-3
 * focus-visible:ring-ring/50`, or the sidebar's `ring-2`/`sidebar-ring`
 * design-system exception) on every native button/input control within
 * `root`. jsdom cannot render or measure the visual ring itself, so this
 * pins the utility class in code rather than a rendered pixel result — the
 * same technique used to pin H3/H4 throughout T071-T084.
 *
 * Excludes the `input-otp` package's root element (`[data-slot="input-otp"]`):
 * by design (input-otp.tsx) that native `<input>` is visually hidden and the
 * focus indicator is rendered on its sibling `input-otp-slot` elements
 * instead, which already carry `data-[active=true]:ring-3` (T076, Session 22).
 */
function assertVisibleFocusOnControls(root: HTMLElement) {
  const controls = root.querySelectorAll('button, input:not([data-slot="input-otp"])');
  expect(controls.length).toBeGreaterThan(0);
  controls.forEach((el) => {
    expect((el as HTMLElement).className).toMatch(/focus-visible:ring-(2|3)/);
  });
}

describe('E-A11Y/THEME — accessibility + theme-flash (H1/H4/H6, FR-030/FR-031)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
        revokeObjectURL: vi.fn(),
      }),
    );
    clearAccessToken();
    setMobileViewport(false);

    // Reset theme/sidebar DOM state and cookies between tests so boot-script
    // assertions in the "Theme flash" block start from a clean slate.
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme-mode');
    document.documentElement.removeAttribute('data-sidebar-collapsed');
    document.documentElement.style.removeProperty('color-scheme');
    document.cookie = 'admin_theme_mode=; path=/; max-age=0';
    document.cookie = 'admin_sidebar_collapsed=; path=/; max-age=0';
  });

  // ── Login page (FR-031) ────────────────────────────────────────────────

  describe('Login page', () => {
    function renderLogin() {
      return render(
        <MemoryRouter initialEntries={['/admin/login']}>
          <div data-admin className="admin-root">
            <Routes>
              <Route path="/admin/login" element={<Login onSubmit={() => {}} />} />
            </Routes>
          </div>
        </MemoryRouter>,
      );
    }

    it('has zero accessibility violations', async () => {
      const { container } = renderLogin();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('shows a visible focus ring on every button and input (H4)', () => {
      const { container } = renderLogin();
      assertVisibleFocusOnControls(container);
    });
  });

  // ── TwoFactor page (FR-031) ─────────────────────────────────────────────

  describe('TwoFactor page', () => {
    function renderTwoFactor() {
      return render(
        <MemoryRouter initialEntries={['/admin/two-factor']}>
          <div data-admin className="admin-root">
            <Routes>
              <Route
                path="/admin/two-factor"
                element={
                  <TwoFactor challengeId="test-challenge" onSubmit={() => {}} onResend={() => {}} />
                }
              />
            </Routes>
          </div>
        </MemoryRouter>,
      );
    }

    it('has zero accessibility violations', async () => {
      const { container } = renderTwoFactor();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('shows a visible focus ring on every button and input (H4)', () => {
      const { container } = renderTwoFactor();
      assertVisibleFocusOnControls(container);
    });
  });

  // ── ResetPassword page (FR-031) ─────────────────────────────────────────

  describe('ResetPassword page', () => {
    function renderResetPassword() {
      return render(
        <MemoryRouter initialEntries={['/admin/reset-password?token=test-token']}>
          <div data-admin className="admin-root">
            <Routes>
              <Route path="/admin/reset-password" element={<ResetPassword onSubmit={() => {}} />} />
            </Routes>
          </div>
        </MemoryRouter>,
      );
    }

    it('has zero accessibility violations', async () => {
      const { container } = renderResetPassword();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('shows a visible focus ring on every button and input (H4)', () => {
      const { container } = renderResetPassword();
      assertVisibleFocusOnControls(container);
    });
  });

  // ── Shell — desktop sidebar (H6) ────────────────────────────────────────

  describe('Shell (desktop)', () => {
    it('has zero accessibility violations', async () => {
      const { container } = render(<AppShell user={testUser} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('shows a visible focus ring on every button and input (H4)', () => {
      const { container } = render(<AppShell user={testUser} />);
      assertVisibleFocusOnControls(container);
    });
  });

  // ── Shell — mobile off-canvas drawer (H5/H6) ────────────────────────────
  // Carry-forward from the T100 review (Session 32): the mobile SheetContent
  // (sidebar.tsx:172-181) renders with no SheetTitle/SheetDescription, which
  // Radix's Dialog primitive relies on for an accessible name — axe flags
  // this as a real violation. This sub-test is expected to fail until T128
  // adds a visually-hidden title + description to the mobile drawer.

  describe('Shell (mobile off-canvas drawer)', () => {
    it('has zero accessibility violations when the drawer is open', async () => {
      setMobileViewport(true);
      render(<AppShell user={testUser} />);

      // Allow the isMobile useEffect (H5 matchMedia read) to resolve, then
      // open the drawer via the same trigger used on desktop — toggleSidebar
      // branches internally on isMobile (sidebar.tsx).
      const trigger = await screen.findByRole('button', { name: /toggle sidebar/i });
      fireEvent.click(trigger);

      // The Sheet renders via a Radix Portal into document.body, so the axe
      // scan target must be the whole body, not just the render() container.
      // sidebar.tsx passes `data-slot="sidebar"` into SheetContent, which
      // overrides sheet.tsx's own `data-slot="sheet-content"` via prop
      // spread — `role="dialog"` is the reliable, override-proof signal that
      // Radix's Dialog content has mounted.
      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
      });

      const results = await axe(document.body);
      expect(results).toHaveNoViolations();
    });
  });

  // ── Settings page (FR-034/FR-035) ───────────────────────────────────────

  describe('Settings page', () => {
    function renderSettings() {
      return render(
        <MemoryRouter initialEntries={['/admin/settings']}>
          <Routes>
            <Route path="/admin/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route
              path="/admin/settings"
              element={
                <AuthProvider>
                  <AdminGuard>
                    <Settings />
                  </AdminGuard>
                </AuthProvider>
              }
            />
          </Routes>
        </MemoryRouter>,
      );
    }

    async function waitForSettingsPage() {
      await waitFor(() => {
        expect(screen.getByTestId('settings-page')).toBeInTheDocument();
      });
    }

    it('has zero accessibility violations', async () => {
      const { container } = renderSettings();
      await waitForSettingsPage();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('shows a visible focus ring on every button and input (H4)', async () => {
      const { container } = renderSettings();
      await waitForSettingsPage();
      assertVisibleFocusOnControls(container);
    });
  });

  // ── Theme flash on first paint (H1) ─────────────────────────────────────
  // Pins that once the pre-paint boot script (boot.ts, T078) has applied a
  // persisted theme to the document root, mounting the Shell never overrides
  // it with a different default before ThemeProvider's own state settles —
  // i.e. no intermediate "flash" between the boot script's paint and the
  // first React-rendered frame. ThemeProvider.test.tsx (T077) already proves
  // boot.ts's cookie-resolution matrix in isolation; this test instead proves
  // the boot script and ThemeProvider stay synchronised once mounted together.

  describe('Theme flash on first paint', () => {
    it('keeps the boot-applied dark theme unchanged through Shell mount (no flash)', () => {
      document.cookie = 'admin_theme_mode=dark; path=/';
      applyBootTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      render(<AppShell user={testUser} />);

      // Checked immediately after the synchronous render — no waitFor.
      // ThemeProvider's lazy useState initializer reads the same cookie
      // boot.ts already applied, so no divergent first frame exists.
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
    });

    it('keeps the boot-applied light theme unchanged through Shell mount (no flash)', () => {
      document.cookie = 'admin_theme_mode=light; path=/';
      applyBootTheme();
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      render(<AppShell user={testUser} />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('light');
    });
  });
});
