// T127 — E-A11Y/THEME accessibility + theme-flash test.
// Runs an automated axe scan against each Phase 1 surface (login, two-factor,
// password reset, shell, settings) asserting zero accessibility violations,
// spot-checks that every native button/input control carries the H4
// focus-visible ring utility, pins H1 (no wrong-theme frame on first paint)
// at the Shell-mount integration level, and independently verifies H6's
// contrast requirement by computing WCAG contrast ratios directly from the
// OKLCH token values (Session 48 review: axe-core's `color-contrast` rule
// does not run in jsdom — there is no real layout/paint engine to sample
// rendered pixels against, so it is silently skipped/marked "incomplete"
// rather than pass or fail. The `toHaveNoViolations()` assertions below
// therefore verify every WCAG rule axe *can* evaluate without a browser
// (ARIA semantics, name/role/value, keyboard structure) but never contrast;
// the "Token contrast (H6)" block at the bottom is the only real contrast
// verification in this file).
// Pins US2-6 + H1/H4/H5/H6 + FR-030/FR-031.
//
// Scoped Node types (this browser-facing tsconfig's `types` array is
// intentionally limited to `vite/client`/`vitest/globals`): the Token
// contrast block below reads tokens.css directly via `fs.readFileSync` so it
// can't silently drift from the actual source file. Vite's `?raw` import
// suffix was tried first but is stubbed to an empty string by Vitest's
// default CSS-import interception, which applies to any `.css`-extensioned
// specifier regardless of query suffix.
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
 * focus-visible:ring-ring/50`) on every native button/input control within
 * `root`. jsdom cannot render or measure the visual ring itself, so this
 * pins the utility class in code rather than a rendered pixel result — the
 * same technique used to pin H3/H4 throughout T071-T084.
 *
 * Matches `ring-3` only (Session 48 review nit): Session 21 already migrated
 * every sidebar/topbar/sheet control from the earlier `ring-2`/`sidebar-ring`
 * exception to the exact H4 value, so a regex still accepting `ring-2` was
 * stale and would silently pass a future regression back to the old value.
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
    expect((el as HTMLElement).className).toMatch(/focus-visible:ring-3/);
  });
}

// ── Token contrast verification (H6) ─────────────────────────────────────
// Computes real WCAG 2.1 contrast ratios from the OKLCH values in
// tokens.css — the actual source of truth, read from disk so this can't
// silently drift from it — since axe cannot verify contrast in jsdom (see
// the file header). Conversion uses Ottosson's published OKLab <-> linear
// sRGB matrices (https://bottosson.github.io/posts/oklab/); the WCAG
// relative-luminance weighting is applied directly to the linear-light
// output (no gamma decode step, since OKLab already yields linear values).

const TOKENS_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'tokens.css',
);

// admin.css source path (T036a) — read directly so the class-based dark
// variant registration can't silently drift from the actual source file,
// mirroring the tokens.css read pattern above.
const ADMIN_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'admin.css',
);

interface Oklch {
  l: number;
  c: number;
  h: number;
}

/** Parses the "L C H" (H optional, defaults to 0) body of an oklch(...) function. */
function parseOklch(raw: string): Oklch {
  const [l, c = 0, h = 0] = raw.trim().split(/\s+/).map(Number);
  return { l, c, h };
}

/**
 * Converts an OKLCH colour to WCAG relative luminance via OKLab -> linear
 * sRGB (Ottosson's matrices), then the standard Y = 0.2126R + 0.7152G +
 * 0.0722B relative-luminance weighting.
 */
function oklchToRelativeLuminance({ l, c, h }: Oklch): number {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const lCubed = l_ ** 3;
  const mCubed = m_ ** 3;
  const sCubed = s_ ** 3;

  const r = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const g = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const bLin = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;

  return 0.2126 * r + 0.7152 * g + 0.0722 * bLin;
}

/** WCAG 2.1 contrast ratio between two relative luminance values. */
function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Extracts `--token: oklch(...)` custom properties scoped to one theme block. */
function parseThemeTokens(cssBlock: string): Record<string, Oklch> {
  const tokens: Record<string, Oklch> = {};
  const re = /--([\w-]+):\s*oklch\(([^)]+)\)/g;
  for (const match of cssBlock.matchAll(re)) {
    tokens[match[1]] = parseOklch(match[2]);
  }
  return tokens;
}

const tokensCss = readFileSync(TOKENS_CSS_PATH, 'utf8');
const adminCss = readFileSync(ADMIN_CSS_PATH, 'utf8');

// Isolate the unconditional `.admin-root { ... }` (light) block from the
// `.dark .admin-root { ... }` (dark) descendant-selector block (T036b — the
// dark palette must engage wherever `.admin-root` renders under an ancestor
// carrying `.dark`, since `ThemeProvider` only ever toggles `.dark` on
// `document.documentElement`, never on the nested `.admin-root` div) so
// identically-named custom properties don't collide. The light-mode pattern
// uses a negative lookbehind to skip the `.admin-root {` text embedded
// inside the dark block's own selector (`.dark .admin-root {` also
// textually matches a bare `\.admin-root\s*\{` scan).
const lightBlockMatch = tokensCss.match(/(?<!\.dark )\.admin-root\s*\{([^}]+)\}/);
const darkBlockMatch = tokensCss.match(/\.dark\s+\.admin-root\s*\{([^}]+)\}/);
if (!lightBlockMatch || !darkBlockMatch) {
  throw new Error('Could not locate .admin-root / .dark .admin-root blocks in tokens.css');
}
const lightTokens = parseThemeTokens(lightBlockMatch[1]);
const darkTokens = parseThemeTokens(darkBlockMatch[1]);

/**
 * Normal-text foreground/background pairs (WCAG 1.4.3, H6 "4.5:1 normal")
 * actually used for body/label/button text across the Phase 1 surfaces.
 * The focus ring's "3:1 large" clause is intentionally not computed here:
 * H4 applies it at 50% alpha (`ring/50`) over whatever surface sits beneath
 * a given control, so a single static token-pair ratio cannot represent its
 * effective composited contrast — that value is inherited unmodified from
 * the reference template's Default preset (Template Parity Gate, plan.md
 * §5A) rather than a Phase 1 implementation choice, so it is out of scope
 * for this test to police.
 */
const NORMAL_TEXT_PAIRS: Array<[fg: string, bg: string]> = [
  ['foreground', 'background'],
  ['muted-foreground', 'background'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['sidebar-foreground', 'sidebar'],
];

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

  // ── Token contrast (H6) ──────────────────────────────────────────────────
  // Real, computed contrast verification — see the file header and the
  // NORMAL_TEXT_PAIRS comment above for why this exists and what it does
  // not cover.

  describe('Token contrast (H6)', () => {
    it.each(NORMAL_TEXT_PAIRS)('meets 4.5:1 in light mode: %s on %s', (fg, bg) => {
      const ratio = contrastRatio(
        oklchToRelativeLuminance(lightTokens[fg]),
        oklchToRelativeLuminance(lightTokens[bg]),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });

    it.each(NORMAL_TEXT_PAIRS)('meets 4.5:1 in dark mode: %s on %s', (fg, bg) => {
      const ratio = contrastRatio(
        oklchToRelativeLuminance(darkTokens[fg]),
        oklchToRelativeLuminance(darkTokens[bg]),
      );
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  // ── Dark-mode class-based variant (T036a) ────────────────────────────────
  // Tailwind v4's default `dark:` strategy is `@media (prefers-color-scheme:
  // dark)` — a `dark:`-prefixed utility only reacts to the OS colour-scheme
  // unless the class-based strategy is registered explicitly. Without this
  // registration every `dark:` class already shipped (button, input, select,
  // tabs, badge, dropdown-menu, input-otp, KpiStrip) tracks the visitor's OS
  // preference instead of the in-app light/dark toggle (`ThemeProvider`'s
  // `.dark` class on `document.documentElement`).

  describe('Dark-mode class-based variant (T036a)', () => {
    it('registers the class-based dark variant so dark: utilities track the in-app toggle, not the OS colour-scheme', () => {
      expect(adminCss).toMatch(/@custom-variant\s+dark\s*\(&:is\(\.dark \*\)\)\s*;/);
    });
  });

  // ── Dark-mode selector scope (T036b) ─────────────────────────────────────
  // The dark OKLCH palette must be scoped to a selector that can actually
  // match a real element. `ThemeProvider.applyThemeToDOM` toggles `.dark` on
  // `document.documentElement`, several DOM levels above the nested
  // `.admin-root` div (`AppShell.tsx`) — a compound `.admin-root.dark`
  // selector (same-element match) never matches anything there; the
  // descendant selector `.dark .admin-root` does.

  describe('Dark-mode selector scope (T036b)', () => {
    it('scopes the dark palette to `.dark .admin-root` (descendant), not the dead `.admin-root.dark` compound form', () => {
      expect(tokensCss).toMatch(/\.dark\s+\.admin-root\s*\{/);
      expect(tokensCss).not.toMatch(/\.admin-root\.dark\s*\{/);
    });
  });

  // ── Radius scale completeness (T036e) ────────────────────────────────────
  // The `@theme inline` bridge redefines `--radius-sm` through `--radius-2xl`
  // relative to the pinned base `--radius`, but previously stopped short of
  // `--radius-3xl` / `--radius-4xl` (used by badge.tsx's `rounded-4xl` pill),
  // which silently fell back to Tailwind v4's static built-in defaults
  // (1.5rem / 2rem) instead of scaling with the pinned base radius.

  describe('Radius scale completeness (T036e)', () => {
    it('bridges --radius-3xl and --radius-4xl to the pinned base radius', () => {
      expect(tokensCss).toMatch(/--radius-3xl:\s*calc\(var\(--radius\)\s*\+\s*12px\)/);
      expect(tokensCss).toMatch(/--radius-4xl:\s*calc\(var\(--radius\)\s*\+\s*16px\)/);
    });
  });

  // ── Raw-token references in hand-written CSS (T036f) ─────────────────────
  // `@theme inline` is a compile-time alias Tailwind's own utility generator
  // uses to inline `bg-background`/`text-foreground`/etc. classes directly
  // to `var(--background)` at build time — it never emits `--color-background`
  // (etc.) as an actual runtime custom property. Confirmed live in a real
  // browser (T036 re-check, 2026-07-21): `.admin-root`'s `background-color:
  // var(--color-background)` resolved to `rgba(0,0,0,0)` (transparent) in
  // BOTH light and dark mode, because `--color-background` never existed at
  // runtime — this is why the page's own background never visibly changed
  // even after T036a/T036b correctly fixed the dark-mode selector/variant
  // machinery underneath it. Hand-written CSS (as opposed to Tailwind
  // utility classes generated from `className` strings) must reference the
  // raw token names tokens.css actually defines.

  describe('Raw-token references in hand-written CSS (T036f)', () => {
    it('references raw tokens (--background/--foreground/--border/--ring), not the dead --color-* @theme-inline aliases, in admin.css', () => {
      expect(adminCss).toMatch(/background-color:\s*var\(--background\)/);
      expect(adminCss).toMatch(/color:\s*var\(--foreground\)/);
      expect(adminCss).toMatch(/border-color:\s*var\(--border,/);
      expect(adminCss).toMatch(/color-mix\(in oklch, var\(--ring\)/);
      expect(adminCss).not.toMatch(/var\(--color-(background|foreground|border|ring)/);
    });
  });
});
