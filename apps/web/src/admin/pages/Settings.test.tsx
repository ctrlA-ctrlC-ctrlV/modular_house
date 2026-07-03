// T094 — Settings page test (T-F6 settings slice).
// Asserts the password-change form (current + new twice), photo upload/remove
// with initials fallback, read-only name + email, super_admin read-only, and
// that the page is unreachable without an authenticated session.
// Pins US4-1..8 + FR-032/FR-033/FR-034/FR-035.
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
