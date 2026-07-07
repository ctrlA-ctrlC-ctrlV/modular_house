// T098 — Theme + sidebar persistence integration test (T-F2).
//
// Verifies the full server round-trip for per-user UI preferences (H1/H2,
// FR-024): the authenticated shell hydrates themeMode + sidebarCollapsed from
// /admin/auth/me (authoritative), every toggle PUTs the new value to
// /admin/settings/preferences, and the cookie mirror is kept in sync so the
// boot script can replay the same state before React hydrates on the next
// reload (zero wrong-theme frames). Renders the real App tree — not a stubbed
// route table — so the AdminShell → AppShell → ThemeProvider wiring is
// exercised end to end against a mocked transport.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';
import { clearAccessToken, setAccessToken } from '../auth/apiClient.js';

// ── Transport mock ───────────────────────────────────────────────────────────

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

const mockFetch = vi.fn(
  (_url: string, _init?: Parameters<typeof fetch>[1]): Promise<MockResponse> =>
    Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }),
);
vi.stubGlobal('fetch', mockFetch);

// jsdom lacks createObjectURL; usePhotoUrl would call it if a photo were
// present. Stubbed defensively even though the test fixture has no photo.
vi.stubGlobal('URL', Object.assign(URL, {
  createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
  revokeObjectURL: vi.fn(),
}));

// Authenticated fixture — matches the OpenAPI Me schema (contracts/
// admin-auth.openapi.yaml). hasProfilePhoto=false avoids the photo fetch.
const testMe = {
  id: 'user-1',
  email: 'admin@example.com',
  displayName: 'Ada Admin',
  role: 'admin',
  permissions: ['pages:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'light' as const, sidebarCollapsed: false },
};

interface MockOverrides {
  me?: { status: number; body: unknown };
  preferencesPut?: { status: number; body: unknown };
}

function jsonResponse(status: number, body: unknown): Promise<MockResponse> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// Routes the stubbed global fetch to per-endpoint canned responses. The
// authenticated shell only issues /me (hydration) and PUT /preferences
// (toggle persistence) during these tests; every other path returns 404.
function setupMocks(overrides: MockOverrides = {}) {
  mockFetch.mockImplementation((url: string, init?: Parameters<typeof fetch>[1]) => {
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.includes('/admin/auth/me') && method === 'GET') {
      const r = overrides.me ?? { status: 200, body: testMe };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/settings/preferences') && method === 'PUT') {
      const r = overrides.preferencesPut ?? { status: 200, body: {} };
      return jsonResponse(r.status, r.body);
    }
    return jsonResponse(404, {});
  });
}

function renderAdmin(initialEntries: string[]) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function callsTo(urlFragment: string, method?: string) {
  return mockFetch.mock.calls.filter(([url, init]) => {
    if (!String(url).includes(urlFragment)) return false;
    if (method && (init?.method ?? 'GET').toUpperCase() !== method.toUpperCase()) return false;
    return true;
  });
}

// Parses the JSON body of a matched fetch call, asserting the call exists and
// carried a string body first (avoids non-null assertions at call sites).
function parseCallBody(urlFragment: string, method?: string): unknown {
  const call = callsTo(urlFragment, method)[0];
  expect(call).toBeDefined();
  const body = call?.[1]?.body;
  expect(typeof body).toBe('string');
  return JSON.parse(body as string);
}

// ── Test harness ─────────────────────────────────────────────────────────────

const THEME_COOKIE = 'admin_theme_mode';
const SIDEBAR_COOKIE = 'admin_sidebar_collapsed';

function resetDocumentRoot() {
  const root = document.documentElement;
  root.classList.remove('dark');
  root.removeAttribute('data-theme-mode');
  root.removeAttribute('data-sidebar-collapsed');
  root.style.removeProperty('color-scheme');
}

function clearCookies() {
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0`;
  // SidebarProvider also mirrors state into a legacy `sidebar_state` cookie;
  // clear it so toggle counts and assertions stay deterministic.
  document.cookie = 'sidebar_state=; path=/; max-age=0';
}

describe('Theme + sidebar persistence (T098, T-F2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
    clearCookies();
    resetDocumentRoot();
  });

  // ── Server-authoritative hydration (H1/H2) ───────────────────────────

  it('hydrates theme + sidebar from /me on mount (server is authoritative)', async () => {
    setAccessToken('test-token');
    setupMocks({
      me: {
        status: 200,
        body: { ...testMe, preferences: { themeMode: 'dark', sidebarCollapsed: true } },
      },
    });
    renderAdmin(['/admin/settings']);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    // After hydration the DOM reflects the server preference, not the
    // (empty) cookie default of system/expanded.
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    });
  });

  // ── Toggle → PUT round-trip (FR-024) ──────────────────────────────────

  it('toggling dark mode PUTs the new themeMode and updates the DOM + cookie mirror', async () => {
    setAccessToken('test-token');
    setupMocks({ me: { status: 200, body: testMe } }); // light / expanded
    renderAdmin(['/admin/settings']);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    // FR-024: the full preferences object is persisted.
    await waitFor(() => {
      expect(callsTo('/admin/settings/preferences', 'PUT')).toHaveLength(1);
    });
    expect(parseCallBody('/admin/settings/preferences', 'PUT')).toEqual({
      themeMode: 'dark',
      sidebarCollapsed: false,
    });

    // DOM reflects the new mode immediately (optimistic local update).
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Cookie mirror stays in sync so the boot script can replay the mode
    // before React hydrates on the next reload (H1: no wrong-theme frame).
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });

  it('toggling sidebar collapse PUTs the new sidebarCollapsed and updates the DOM + cookie mirror', async () => {
    setAccessToken('test-token');
    setupMocks({ me: { status: 200, body: testMe } }); // light / expanded
    renderAdmin(['/admin/settings']);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }));

    await waitFor(() => {
      expect(callsTo('/admin/settings/preferences', 'PUT')).toHaveLength(1);
    });
    expect(parseCallBody('/admin/settings/preferences', 'PUT')).toEqual({
      themeMode: 'light',
      sidebarCollapsed: true,
    });

    // DOM + cookie mirror reflect the collapsed state (H2).
    expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=true`);
  });

  // ── Remount restore + no-flash (T-F2) ─────────────────────────────────

  it('state restores from the server on remount with the cookie mirror kept in sync (no flash)', async () => {
    setAccessToken('test-token');
    const savedPrefs = { themeMode: 'dark' as const, sidebarCollapsed: true };
    setupMocks({ me: { status: 200, body: { ...testMe, preferences: savedPrefs } } });

    const { unmount } = renderAdmin(['/admin/settings']);
    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
      expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
    });

    // The cookie mirror was written during hydration — a real reload would
    // let the boot script paint dark/collapsed before React mounts.
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=true`);

    unmount();

    // Remount: the server returns the same preferences; the shell restores
    // to the same state without reverting to a default first.
    setupMocks({ me: { status: 200, body: { ...testMe, preferences: savedPrefs } } });
    renderAdmin(['/admin/settings']);
    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-sidebar-collapsed')).toBe('true');
  });

  // ── Cross-device correction (H1: server is source of truth) ───────────

  it('corrects a stale cookie using the server preference on hydration', async () => {
    // Stale local cookie says light/expanded; another device saved dark.
    document.cookie = `${THEME_COOKIE}=light; path=/`;
    document.cookie = `${SIDEBAR_COOKIE}=false; path=/`;

    setAccessToken('test-token');
    setupMocks({
      me: {
        status: 200,
        body: { ...testMe, preferences: { themeMode: 'dark', sidebarCollapsed: false } },
      },
    });
    renderAdmin(['/admin/settings']);

    await waitFor(() => {
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
    // Cookie mirror is refreshed to the authoritative value.
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
  });
});
