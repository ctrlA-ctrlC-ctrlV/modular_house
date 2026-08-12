// T097a — Pre-auth page wiring integration test.
// Renders the real App tree (per the no-legacy.test.tsx pattern — not a
// stubbed route table) and drives each pre-auth page's controls to confirm
// they actually call the real API and navigate as designed. Closes the gap
// the Session 30 review found in T096: Login/TwoFactor/ForgotPassword/
// ResetPassword were mounted with zero props, so onSubmit/onResend did
// nothing when submitted in a browser.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';
import { clearAccessToken, getAccessToken } from '../auth/apiClient.js';

// ── Mock setup ─────────────────────────────────────────────────────────────────

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

const testMe = {
  id: 'user-1',
  email: 'admin@example.com',
  displayName: 'Ada Admin',
  role: 'admin',
  permissions: ['pages:view'],
  hasProfilePhoto: false,
  isSuperAdmin: false,
  preferences: { themeMode: 'system' as const, sidebarCollapsed: false },
};

interface MockOverrides {
  login?: { status: number; body: unknown };
  verify2fa?: { status: number; body: unknown };
  resend?: { status: number; body: unknown };
  forgot?: { status: number; body: unknown };
  reset?: { status: number; body: unknown };
  me?: { status: number; body: unknown };
}

function jsonResponse(status: number, body: unknown): Promise<MockResponse> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

// Routes the stubbed global fetch to per-endpoint canned responses so each
// test can focus on page/container behavior rather than re-deriving the
// transport. Defaults represent the happy path for every endpoint.
function setupMocks(overrides: MockOverrides = {}) {
  mockFetch.mockImplementation((url: string, init?: Parameters<typeof fetch>[1]) => {
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.includes('/admin/auth/login') && method === 'POST') {
      const r = overrides.login ?? {
        status: 200,
        body: { challengeId: 'chal-default-1', message: 'A code has been sent to your email.' },
      };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/auth/verify-2fa') && method === 'POST') {
      const r = overrides.verify2fa ?? {
        status: 200,
        body: { accessToken: 'test-access-token', expiresIn: 900, user: testMe },
      };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/auth/resend-code') && method === 'POST') {
      const r = overrides.resend ?? { status: 200, body: { message: 'A new code has been sent.' } };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/auth/forgot-password') && method === 'POST') {
      const r = overrides.forgot ?? {
        status: 200,
        body: { message: 'If an account with that email exists, a link has been sent.' },
      };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/auth/reset-password') && method === 'POST') {
      const r = overrides.reset ?? { status: 200, body: { message: 'Password reset successfully.' } };
      return jsonResponse(r.status, r.body);
    }
    if (url.includes('/admin/auth/me')) {
      const r = overrides.me ?? { status: 200, body: testMe };
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

function findCall(urlFragment: string) {
  return mockFetch.mock.calls.find(([url]) => String(url).includes(urlFragment));
}

function callsTo(urlFragment: string) {
  return mockFetch.mock.calls.filter(([url]) => String(url).includes(urlFragment));
}

// Parses the JSON body of a matched fetch call, asserting the call exists
// and carried a string body first (avoids non-null assertions at call sites).
function parseCallBody(urlFragment: string): unknown {
  const call = findCall(urlFragment);
  expect(call).toBeDefined();
  const body = call?.[1]?.body;
  expect(typeof body).toBe('string');
  return JSON.parse(body as string);
}

// Types a 6-digit code into the hidden native input the `input-otp` package
// renders (the visible slots are read-only display divs driven by context).
function typeOtpCode(code: string) {
  const input = screen.getByLabelText(/verification code/i);
  fireEvent.change(input, { target: { value: code } });
}

describe('Pre-auth page wiring (T097a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
  });

  // ── Login → two-factor (FR-010/FR-011) ───────────────────────────────

  describe('Login', () => {
    it('submits the form, calls POST /admin/auth/login, and navigates to two-factor carrying the challengeId', async () => {
      setupMocks({
        login: { status: 200, body: { challengeId: 'chal-xyz-789', message: 'Code sent.' } },
      });
      renderAdmin(['/admin/login']);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'admin@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'ValidPass123!' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

      await waitFor(() => {
        expect(screen.getByTestId('two-factor-page')).toBeInTheDocument();
      });

      expect(parseCallBody('/admin/auth/login')).toEqual({
        email: 'admin@example.com',
        password: 'ValidPass123!',
      });

      // Prove the challengeId was actually carried forward: submitting the
      // OTP now must reference the exact id returned by login.
      setupMocks({
        login: { status: 200, body: { challengeId: 'chal-xyz-789', message: 'Code sent.' } },
      });
      typeOtpCode('123456');
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      await waitFor(() => {
        expect(findCall('/admin/auth/verify-2fa')).toBeDefined();
      });
      expect(parseCallBody('/admin/auth/verify-2fa')).toMatchObject({
        challengeId: 'chal-xyz-789',
        code: '123456',
      });
    });

    it('surfaces the server message and stores no token on 423 (locked)', async () => {
      setupMocks({ login: { status: 423, body: { error: 'Locked', message: 'Account is locked.' } } });
      renderAdmin(['/admin/login']);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'ValidPass123!' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/account is locked/i);
      });
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(getAccessToken()).toBeNull();
    });

    it('surfaces the server message and stores no token on 429 (rate limited)', async () => {
      setupMocks({
        login: { status: 429, body: { error: 'TooManyRequests', message: 'Too many attempts.' } },
      });
      renderAdmin(['/admin/login']);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'ValidPass123!' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/too many attempts/i);
      });
      expect(getAccessToken()).toBeNull();
    });
  });

  // ── Two-factor → session → /admin/analytics (B7, E1-E3, Q7) ──────────
  // T082: the post-sign-in landing target moved from /admin/settings to
  // /admin/analytics (Q7, FR-017) — the index route's redirect target.

  describe('TwoFactor', () => {
    async function loginToTwoFactor(challengeId = 'chal-1') {
      setupMocks({ login: { status: 200, body: { challengeId, message: 'Code sent.' } } });
      renderAdmin(['/admin/login']);

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'ValidPass123!' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in|log in|login/i }));

      await waitFor(() => {
        expect(screen.getByTestId('two-factor-page')).toBeInTheDocument();
      });
    }

    it('verifies the code, stores the access token, and lands on /admin/analytics', async () => {
      await loginToTwoFactor('chal-1');

      setupMocks({
        login: { status: 200, body: { challengeId: 'chal-1', message: 'Code sent.' } },
        verify2fa: {
          status: 200,
          body: { accessToken: 'session-access-token', expiresIn: 900, user: testMe },
        },
        me: { status: 200, body: testMe },
      });

      typeOtpCode('654321');
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
      });
      expect(getAccessToken()).toBe('session-access-token');
    });

    it('surfaces the server message and stores no token on 401 (wrong code)', async () => {
      await loginToTwoFactor('chal-1');

      setupMocks({
        login: { status: 200, body: { challengeId: 'chal-1', message: 'Code sent.' } },
        verify2fa: { status: 401, body: { error: 'Unauthorized', message: 'Invalid or expired code.' } },
      });

      typeOtpCode('000000');
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid or expired code/i);
      });
      expect(screen.getByTestId('two-factor-page')).toBeInTheDocument();
      expect(getAccessToken()).toBeNull();
    });

    it('clicking resend calls POST /admin/auth/resend-code with the same challengeId', async () => {
      await loginToTwoFactor('chal-resend-1');

      setupMocks({
        login: { status: 200, body: { challengeId: 'chal-resend-1', message: 'Code sent.' } },
        resend: { status: 200, body: { message: 'A new code has been sent.' } },
      });

      fireEvent.click(screen.getByRole('button', { name: /resend code/i }));

      await waitFor(() => {
        expect(callsTo('/admin/auth/resend-code')).toHaveLength(1);
      });
      expect(parseCallBody('/admin/auth/resend-code')).toEqual({ challengeId: 'chal-resend-1' });
    });
  });

  // ── Forgot password — neutral confirmation (C4) ──────────────────────

  describe('ForgotPassword', () => {
    it('submits the form, calls POST /admin/auth/forgot-password, and shows the neutral confirmation', async () => {
      setupMocks({
        forgot: { status: 200, body: { message: 'If an account exists, a link has been sent.' } },
      });
      renderAdmin(['/admin/forgot-password']);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'unknown@example.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText(/password-reset link has been sent/i)).toBeInTheDocument();
      });

      expect(parseCallBody('/admin/auth/forgot-password')).toEqual({ email: 'unknown@example.com' });
    });
  });

  // ── Reset password — consume token, navigate to login (C2/C3) ────────

  describe('ResetPassword', () => {
    it('submits with the URL token, calls POST /admin/auth/reset-password, and navigates to /admin/login on success', async () => {
      setupMocks({ reset: { status: 200, body: { message: 'Password reset successfully.' } } });
      renderAdmin(['/admin/reset-password?token=reset-token-abc']);

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });

      expect(parseCallBody('/admin/auth/reset-password')).toEqual({
        token: 'reset-token-abc',
        newPassword: 'NewPassw0rd456',
        confirmPassword: 'NewPassw0rd456',
      });
    });

    it('surfaces the server message and does not navigate on 400 (policy violation)', async () => {
      setupMocks({
        reset: { status: 400, body: { error: 'BadRequest', message: 'Password does not meet policy.' } },
      });
      renderAdmin(['/admin/reset-password?token=reset-token-abc']);

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/does not meet policy/i);
      });
      expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
    });

    it('surfaces the server message and does not navigate on 410 (used/expired link)', async () => {
      setupMocks({
        reset: { status: 410, body: { error: 'Gone', message: 'This reset link has expired.' } },
      });
      renderAdmin(['/admin/reset-password?token=reset-token-abc']);

      fireEvent.change(screen.getByLabelText(/new password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'NewPassw0rd456' },
      });
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/reset link has expired/i);
      });
      expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
    });
  });
});
