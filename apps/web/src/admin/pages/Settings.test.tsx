// T094 — Settings page test (T-F6 settings slice).
// Asserts the password-change form (current + new twice), photo upload/remove
// with initials fallback, read-only name + email, super_admin read-only, and
// that the page is unreachable without an authenticated session.
// Pins US4-1..8 + FR-032/FR-033/FR-034/FR-035.
//
// T144 (Group D) adds a heading/subtitle contrast-regression assertion at
// the bottom of this file — see that describe block's own header comment
// for the real-stylesheet-injection technique it uses, shared with
// a11y.test.tsx's T138/T140 suites and Login.test.tsx's T143 suite.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../auth/AuthProvider.js';
import { AdminGuard } from '../auth/guard.js';
import { clearAccessToken } from '../auth/apiClient.js';
import { Settings } from './Settings.js';

// ── Mock setup ─────────────────────────────────────────────────────────────────

// Mock fetch for every request the page issues (me, photo, password).
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// jsdom does not implement the Blob object-URL APIs used to preview photo bytes.
vi.stubGlobal('URL', Object.assign(URL, {
  createObjectURL: vi.fn(() => 'blob:mock-preview-url'),
  revokeObjectURL: vi.fn(),
}));

// Default authenticated admin user (no photo, not super_admin).
const regularUser = {
  id: 'user-1',
  email: 'admin@example.com',
  displayName: 'Ada Admin',
  role: 'admin',
  permissions: ['pages:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
};

// A user who already has a profile photo set.
const userWithPhoto = {
  ...regularUser,
  id: 'user-2',
  hasProfilePhoto: true,
};

// The super_admin account — read-only per FR-035.
const superAdminUser = {
  ...regularUser,
  id: 'user-3',
  email: 'super@example.com',
  displayName: 'Super Admin',
  role: 'super_admin',
  isSuperAdmin: true,
};

interface MockOverrides {
  me?: typeof regularUser;
  photoGet?: Blob;
  passwordPut?: { status: number; body: unknown };
  photoPut?: { status: number; body: unknown };
  photoDelete?: { status: number; body: unknown };
}

// Routes the stubbed global fetch to per-endpoint canned responses so each
// test can focus on the page behavior rather than re-deriving the transport.
function setupMocks(overrides: MockOverrides = {}) {
  const me = overrides.me ?? regularUser;

  mockFetch.mockImplementation((url: string, init?: Parameters<typeof fetch>[1]) => {
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.includes('/admin/auth/me')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(me) });
    }

    if (url.includes('/admin/settings/photo') && method === 'GET') {
      if (overrides.photoGet) {
        return Promise.resolve({
          ok: true,
          status: 200,
          blob: () => Promise.resolve(overrides.photoGet as Blob),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    }

    if (url.includes('/admin/settings/photo') && method === 'PUT') {
      const result = overrides.photoPut ?? { status: 200, body: { ...me, hasProfilePhoto: true } };
      return Promise.resolve({
        ok: result.status < 300,
        status: result.status,
        json: () => Promise.resolve(result.body),
      });
    }

    if (url.includes('/admin/settings/photo') && method === 'DELETE') {
      const result = overrides.photoDelete ?? { status: 200, body: { ...me, hasProfilePhoto: false } };
      return Promise.resolve({
        ok: result.status < 300,
        status: result.status,
        json: () => Promise.resolve(result.body),
      });
    }

    if (url.includes('/admin/settings/password') && method === 'PUT') {
      const result = overrides.passwordPut ?? { status: 200, body: { message: 'Password changed.' } };
      return Promise.resolve({
        ok: result.status < 300,
        status: result.status,
        json: () => Promise.resolve(result.body),
      });
    }

    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  });
}

// Mounts Settings behind the real AuthProvider + AdminGuard, matching the
// T090 test pattern, so the "unreachable unauthenticated" assertion exercises
// the actual guard rather than a stub.
function renderSettings(initialEntries: string[] = ['/admin/settings']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
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

describe('Settings page (T-F6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
  });

  // ── Password-change form (FR-032, D1-D5) ─────────────────────────────

  describe('Password change form', () => {
    it('renders current password, new password, and confirm password fields', async () => {
      setupMocks();
      renderSettings();
      await waitForSettingsPage();

      expect(screen.getByLabelText(/current password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/^new password$/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirm new password/i)).toHaveAttribute('type', 'password');
    });

    it('renders a submit button to update the password', async () => {
      setupMocks();
      renderSettings();
      await waitForSettingsPage();

      const submitButton = screen.getByRole('button', { name: /update password/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('submits the current + new password and confirms success', async () => {
      setupMocks();
      renderSettings();
      await waitForSettingsPage();

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPassw0rd123' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/updated/i);
      });

      const putCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/password') && init?.method === 'PUT',
      );
      expect(putCalls).toHaveLength(1);
      const [, init] = putCalls[0];
      expect(JSON.parse(init.body as string)).toEqual({
        currentPassword: 'OldPassw0rd123',
        newPassword: 'NewPassw0rd456',
        confirmPassword: 'NewPassw0rd456',
      });
    });

    it('rejects mismatched new-password entries client-side without calling the API', async () => {
      setupMocks();
      renderSettings();
      await waitForSettingsPage();

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'OldPassw0rd123' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'DoesNotMatch789' },
      });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByText(/do not match/i)).toBeInTheDocument();
      });

      const putCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/password') && init?.method === 'PUT',
      );
      expect(putCalls).toHaveLength(0);
    });

    it('surfaces a server-side error (e.g. wrong current password) without clearing the form', async () => {
      setupMocks({
        passwordPut: {
          status: 400,
          body: { error: 'BadRequest', message: 'Current password is incorrect.' },
        },
      });
      renderSettings();
      await waitForSettingsPage();

      fireEvent.change(screen.getByLabelText(/current password/i), {
        target: { value: 'WrongPassw0rd1' },
      });
      fireEvent.change(screen.getByLabelText(/^new password$/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm new password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /update password/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/current password is incorrect/i);
      });
    });
  });

  // ── Profile photo (FR-033, G1-G6) ────────────────────────────────────

  describe('Profile photo', () => {
    it('renders the initials fallback when no photo is set', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      expect(screen.getByText('AA')).toBeInTheDocument();
    });

    it('renders an accessible file input to upload a new photo', async () => {
      setupMocks();
      renderSettings();
      await waitForSettingsPage();

      const fileInput = screen.getByLabelText(/profile photo/i);
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('renders a remove-photo control disabled when no photo is set (G4)', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      expect(screen.getByRole('button', { name: /remove photo/i })).toBeDisabled();
    });

    it('loads the photo bytes and enables removal when a photo is already set', async () => {
      setupMocks({
        me: userWithPhoto,
        photoGet: new Blob(['fake-image-bytes'], { type: 'image/png' }),
      });
      renderSettings();
      await waitForSettingsPage();

      await waitFor(() => {
        expect(document.querySelector('[data-slot="avatar-image"]')).not.toBeNull();
      });
      expect(screen.getByRole('button', { name: /remove photo/i })).not.toBeDisabled();
    });

    it('uploads a new photo and enables the remove control', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      const fileInput = screen.getByLabelText(/profile photo/i);
      const file = new File(['fake-image-bytes'], 'avatar.png', { type: 'image/png' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove photo/i })).not.toBeDisabled();
      });

      const putCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/photo') && init?.method === 'PUT',
      );
      expect(putCalls).toHaveLength(1);
    });

    it('rejects an oversized photo client-side without calling the API (G2)', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      const fileInput = screen.getByLabelText(/profile photo/i);
      const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', {
        type: 'image/png',
      });
      fireEvent.change(fileInput, { target: { files: [oversized] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too large/i);
      });

      const putCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/photo') && init?.method === 'PUT',
      );
      expect(putCalls).toHaveLength(0);
    });

    it('rejects an unsupported photo type client-side without calling the API (G1)', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      const fileInput = screen.getByLabelText(/profile photo/i);
      const wrongType = new File(['gif-bytes'], 'avatar.gif', { type: 'image/gif' });
      fireEvent.change(fileInput, { target: { files: [wrongType] } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/unsupported file type/i);
      });

      const putCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/photo') && init?.method === 'PUT',
      );
      expect(putCalls).toHaveLength(0);
    });

    it('removes an existing photo and disables the remove control (G4)', async () => {
      setupMocks({
        me: userWithPhoto,
        photoGet: new Blob(['fake-image-bytes'], { type: 'image/png' }),
      });
      renderSettings();
      await waitForSettingsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove photo/i })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /remove photo/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove photo/i })).toBeDisabled();
      });

      const deleteCalls = mockFetch.mock.calls.filter(
        ([url, init]) => url.includes('/admin/settings/photo') && init?.method === 'DELETE',
      );
      expect(deleteCalls).toHaveLength(1);
    });
  });

  // ── Read-only personal info (FR-034) ─────────────────────────────────

  describe('Read-only personal info', () => {
    it('displays name and email as read-only text, not editable inputs', async () => {
      setupMocks({ me: regularUser });
      renderSettings();
      await waitForSettingsPage();

      expect(screen.getByText('Ada Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.queryByLabelText(/^name$/i)).toBeNull();
      expect(document.querySelectorAll('input[type="email"]')).toHaveLength(0);
    });
  });

  // ── super_admin read-only (FR-035) ───────────────────────────────────

  describe('super_admin read-only account', () => {
    it('hides password-change and photo-edit controls for super_admin', async () => {
      setupMocks({ me: superAdminUser });
      renderSettings();
      await waitForSettingsPage();

      expect(screen.queryByLabelText(/current password/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /update password/i })).toBeNull();
      expect(screen.queryByLabelText(/profile photo/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /remove photo/i })).toBeNull();
      expect(screen.getByText(/database access/i)).toBeInTheDocument();
    });

    it('still displays the super_admin name and email as read-only', async () => {
      setupMocks({ me: superAdminUser });
      renderSettings();
      await waitForSettingsPage();

      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('super@example.com')).toBeInTheDocument();
    });
  });

  // ── Unreachable unauthenticated (FR-003, US4-8) ──────────────────────

  describe('Unauthenticated access', () => {
    it('redirects to /admin/login instead of rendering settings content', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized', message: 'No valid session' }),
        }),
      );

      renderSettings();

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('settings-page')).toBeNull();
    });
  });
});

// ── Heading/subtitle contrast regression (T144, Group D) ───────────────────
//
// Guards Settings.tsx:240-241's "Settings" heading and its subtitle against
// the same class of leak T138/T139/T141 fixed. Technique mirrors
// a11y.test.tsx's T138/T140 suites and Login.test.tsx's T143 suite: reads
// style.css/admin.css directly from disk and injects their actual rule text
// into jsdom's live cascade (Vitest's default `css: false` behaviour
// otherwise replaces CSS imports with an empty string during tests).
// admin.css's rules are unwrapped from their `@layer base { ... }` block
// before injection — this project's pinned jsdom (25.0.1) cannot parse the
// CSS Cascade Layers `@layer` at-rule at all, silently discarding the
// entire stylesheet on encountering one (verified directly while building
// the a11y.test.tsx sibling suite).
//
// The "Settings" `<h1>` (Settings.tsx:240) carries no Tailwind text-color
// utility class, so it resolves purely via admin.css's base-layer default
// (T141) with no competing rule to consider, and is asserted positively via
// `getComputedStyle`, exactly as a11y.test.tsx's T140 suite does for a bare
// `<h1>`. The subtitle `<p>` (Settings.tsx:241), however, carries an
// explicit `text-muted-foreground` Tailwind utility class — the same
// situation as Login.tsx's subtitle (T143) — so it is checked the same way
// Login.test.tsx checks its own subtitle: proving `text-muted-foreground`
// actually wins the real cascade would require injecting Tailwind's own
// JIT-compiled utility CSS, which the unwrapped-injection technique above
// cannot faithfully reproduce (unwrapping the `@layer` structure to work
// around jsdom's parser gap also erases the real cascade-layer priority a
// live browser applies, per the `@layer theme, base, utilities;`
// pre-declaration T142 added to admin.css). This suite instead checks what
// it can prove honestly: the class name is present, and the element no
// longer resolves the old unlayered style.css leak.

const STYLE_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'styles',
  'style.css',
);
const ADMIN_CSS_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'theme',
  'admin.css',
);
const settingsStyleCss = readFileSync(STYLE_CSS_PATH, 'utf8');
const settingsAdminCss = readFileSync(ADMIN_CSS_PATH, 'utf8');

/** Extracts the inner rule text of a `@layer <layerName> { ... }` block, unwrapped (see comment above). */
function stripLayerWrapper(css: string, layerName: string): string {
  const marker = `@layer ${layerName}`;
  const markerIndex = css.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not locate "@layer ${layerName}" in the provided CSS source`);
  }
  const openBraceIndex = css.indexOf('{', markerIndex);
  if (openBraceIndex === -1) {
    throw new Error(`Malformed "@layer ${layerName}" block: no opening brace found`);
  }
  let depth = 1;
  let i = openBraceIndex + 1;
  for (; i < css.length && depth > 0; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
  }
  if (depth !== 0) {
    throw new Error(`Malformed "@layer ${layerName}" block: unbalanced braces`);
  }
  return css.slice(openBraceIndex + 1, i - 1);
}

describe('Settings page — heading/subtitle contrast regression (T144, Group D)', () => {
  let injectedStyleCss: HTMLStyleElement | null = null;
  let injectedAdminCss: HTMLStyleElement | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
    document.documentElement.classList.add('dark');

    injectedStyleCss = document.createElement('style');
    injectedStyleCss.textContent = settingsStyleCss;
    document.head.appendChild(injectedStyleCss);

    injectedAdminCss = document.createElement('style');
    injectedAdminCss.textContent = stripLayerWrapper(settingsAdminCss, 'base');
    document.head.appendChild(injectedAdminCss);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    injectedStyleCss?.remove();
    injectedAdminCss?.remove();
    injectedStyleCss = null;
    injectedAdminCss = null;
  });

  function renderSettingsInAdminRoot() {
    return render(
      <MemoryRouter initialEntries={['/admin/settings']}>
        <div data-admin className="admin-root">
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
        </div>
      </MemoryRouter>,
    );
  }

  it('resolves --foreground for the "Settings" heading, not --brand-title, when .dark is set', async () => {
    setupMocks();
    renderSettingsInAdminRoot();
    await waitForSettingsPage();

    const heading = screen.getByRole('heading', { level: 1, name: 'Settings' });

    expect(getComputedStyle(heading).color).toBe('var(--foreground)');
  });

  it('keeps the subtitle wired to --muted-foreground via Tailwind and clear of the style.css brand leak', async () => {
    setupMocks();
    renderSettingsInAdminRoot();
    await waitForSettingsPage();

    const subtitle = screen.getByText(/manage your password and profile photo/i);

    // Pins the intended styling mechanism (Tailwind's `text-muted-foreground`
    // utility, which compiles to `color: var(--muted-foreground)`
    // deterministically — see describe-block header for why this suite does
    // not also attempt to prove that resolution via a live cascade read).
    expect(subtitle.className).toMatch(/text-muted-foreground/);
    // Proves the concrete regression T139 fixes: this element no longer
    // resolves style.css's unlayered brand-color leak.
    expect(getComputedStyle(subtitle).color).not.toBe('var(--brand-slate)');
  });
});
