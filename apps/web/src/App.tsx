/**
 * Application Root Component
 * =============================================================================
 *
 * PURPOSE:
 * Defines the top-level route structure for the Modular House web application.
 * Routes are split into two categories:
 *   1. Public routes — served through TemplateLayout with full SEO injection.
 *   2. Admin routes — protected by AdminGuard and rendered without public chrome.
 *
 * URL NORMALIZATION:
 * All routes are wrapped in TrailingSlashRedirect, which strips trailing slashes
 * from pathnames (except the root '/') before matching. This ensures:
 *   - Consistent canonical URLs across the site.
 *   - No duplicate content issues in search engine indexes.
 *   - Alignment with the canonicalUrl values declared in routes-metadata.ts.
 *
 * ARCHITECTURE:
 * - Routes are generated dynamically from the routes array (route-config.tsx).
 * - The TemplateLayout component provides header, footer, scroll management,
 *   and SEO injection for all public routes.
 * - Admin routes bypass the public layout and implement their own navigation.
 *   They are declared inline here rather than in route-config.tsx because that
 *   module's `routes` array also feeds the static sitemap/prerender scripts
 *   (scripts/sitemap-generator.ts, scripts/prerender.ts); the admin panel is
 *   client-only and authenticated, so it must never appear in either output.
 *
 * =============================================================================
 */

import * as React from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { TemplateLayout } from './components/TemplateLayout'
import { TrailingSlashRedirect } from './components/TrailingSlashRedirect'
import { routes } from './route-config'
import GardenRoomConfigurator from './routes/GardenRoomConfigurator'

// Admin panel — pre-auth pages, the authenticated shell, and the auth/guard
// providers (012-panel-phase-1). `admin.css` is imported once here so the
// Tailwind v4 + OKLCH token layer is scoped to `.admin-root` throughout the
// whole admin subtree without ever reaching the public Bootstrap pages above.
import './admin/theme/admin.css'
import { apiClient } from './admin/auth/apiClient'
import { AuthProvider, useAuth } from './admin/auth/AuthProvider'
import { AdminGuard } from './admin/auth/guard'
import { AppShell } from './admin/shell/AppShell'
import type { UserShellData } from './admin/shell/UserSection'
import { Login, type LoginFormData } from './admin/pages/Login'
import { TwoFactor } from './admin/pages/TwoFactor'
import { ForgotPassword, type ForgotPasswordFormData } from './admin/pages/ForgotPassword'
import { ResetPassword } from './admin/pages/ResetPassword'
import { Settings } from './admin/pages/Settings'

/** Redirect helper: forwards /garden-room/configure/:slug to /garden-rooms/configure/:slug */
function GardenRoomConfigureRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/garden-rooms/configure/${slug}`} replace />;
}

/**
 * AdminRoot
 *
 * Scopes a single pre-auth admin page (login, two-factor, forgot/reset
 * password) inside the `.admin-root` / `[data-admin]` subtree so the
 * Tailwind v4 + OKLCH token layer applies (T002/T003). The authenticated
 * shell provides this same scoping itself via AppShell; only the standalone
 * pre-auth pages, which render outside AppShell, need it applied here.
 */
function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <div data-admin className="admin-root">
      {children}
    </div>
  );
}

/**
 * Parses a JSON error body defensively, falling back to a generic message
 * when the response has no body or is not JSON (e.g. a network failure).
 */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * LoginContainer
 *
 * Wires the presentational Login page to `POST /admin/auth/login` (T-B1).
 * On success (200 TwoFactorChallenge, no token minted per B7), navigates to
 * the two-factor step carrying the opaque `challengeId` via router state —
 * never in the URL, since B9 requires it stay unguessable but not secret.
 * On failure (401/423/429), surfaces the server's message through the
 * page's own `error` prop; no session state changes on any failure path.
 */
function LoginContainer() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: LoginFormData) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch('/admin/auth/login', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        setError(await readErrorMessage(response, 'Unable to sign in. Please try again.'));
        return;
      }
      const body = (await response.json()) as { challengeId: string };
      navigate('/admin/two-factor', { state: { challengeId: body.challengeId } });
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminRoot>
      <Login onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} />
    </AdminRoot>
  );
}

/**
 * TwoFactorContainer
 *
 * Wires the presentational TwoFactor page to `POST /admin/auth/verify-2fa`
 * and `POST /admin/auth/resend-code`. Reads the `challengeId` carried from
 * LoginContainer via router state (B9); a direct/refreshed visit with no
 * state redirects back to login rather than rendering a non-functional
 * form. On a correct code, stores the minted access token in memory (E2)
 * and navigates to `/admin`, where the AuthProvider mounted there hydrates
 * the session itself via its own `fetchMe()` call — no extra glue needed.
 */
function TwoFactorContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const challengeId = (location.state as { challengeId?: string } | null)?.challengeId;

  const [error, setError] = React.useState<string | undefined>(undefined);
  const [message, setMessage] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resendDisabled, setResendDisabled] = React.useState(false);

  if (!challengeId) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSubmit = async (data: { challengeId: string; code: string }) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch('/admin/auth/verify-2fa', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        setError(await readErrorMessage(response, 'Invalid or expired code. Please try again.'));
        return;
      }
      const body = (await response.json()) as { accessToken: string };
      apiClient.setAccessToken(body.accessToken);
      navigate('/admin');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // F1: cooldown countdown UI stays deferred to T116 per the existing T085
  // note — this only disables the control while the request is in flight.
  const handleResend = async (id: string) => {
    setError(undefined);
    setMessage(undefined);
    setResendDisabled(true);
    try {
      const response = await apiClient.fetch('/admin/auth/resend-code', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id }),
      });
      if (response.ok) {
        setMessage('A new code has been sent to your email.');
      } else {
        setError(await readErrorMessage(response, 'Unable to resend the code. Please try again.'));
      }
    } finally {
      setResendDisabled(false);
    }
  };

  return (
    <AdminRoot>
      <TwoFactor
        challengeId={challengeId}
        onSubmit={handleSubmit}
        onResend={handleResend}
        error={error}
        message={message}
        isSubmitting={isSubmitting}
        resendDisabled={resendDisabled}
      />
    </AdminRoot>
  );
}

/**
 * ForgotPasswordContainer
 *
 * Wires the presentational ForgotPassword page to
 * `POST /admin/auth/forgot-password`. C4 requires the same neutral
 * confirmation for known and unknown email alike, so any successful (2xx)
 * response — regardless of body — flips the page to its confirmation state;
 * only a transport/server failure surfaces an error.
 */
function ForgotPasswordContainer() {
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch('/admin/auth/forgot-password', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setIsSubmitted(true);
        return;
      }
      setError(await readErrorMessage(response, 'Unable to reach the server. Please try again.'));
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminRoot>
      <ForgotPassword
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        isSubmitted={isSubmitted}
      />
    </AdminRoot>
  );
}

/**
 * ResetPasswordContainer
 *
 * Wires the presentational ResetPassword page to
 * `POST /admin/auth/reset-password`. The page itself reads the `token`
 * query parameter (FR-016); on success, navigates straight back to login
 * (C2/C3: the link is single-use, so there is nothing left to show on this
 * page) rather than lingering on a confirmation state.
 */
function ResetPasswordContainer() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const response = await apiClient.fetch('/admin/auth/reset-password', {
        method: 'POST',
        skipAuth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        setError(await readErrorMessage(response, 'Unable to reset your password. Please try again.'));
        return;
      }
      navigate('/admin/login');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminRoot>
      <ResetPassword onSubmit={handleSubmit} error={error} isSubmitting={isSubmitting} />
    </AdminRoot>
  );
}

/**
 * AdminShell
 *
 * Layout route element for every authenticated `/admin/*` destination. Reads
 * the hydrated session from AuthProvider, derives the sidebar/top-bar user
 * summary, and renders the shared AppShell around the matched child route.
 * Mounted only inside AdminGuard, so a populated `auth.user` is expected;
 * the null branch is a defensive no-op for the render preceding hydration.
 */
function AdminShell() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (!auth.user) {
    return null;
  }

  const shellUser: UserShellData = {
    displayName: auth.user.displayName ?? auth.user.email,
    email: auth.user.email,
    role: auth.user.role,
    hasProfilePhoto: auth.user.hasProfilePhoto,
  };

  return (
    <AppShell
      user={shellUser}
      preferences={auth.user.preferences}
      onPreferencesChange={(prefs) => {
        // FR-024: persist the new themeMode/sidebarCollapsed to the server.
        // Fire-and-forget — the local state + cookie mirror already updated
        // optimistically, so the UI never waits on the network; a failed PUT
        // leaves the UI in the user's chosen state and the next /me hydration
        // re-syncs. The full object is sent so the round-trip is explicit.
        void apiClient
          .fetch('/admin/settings/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefs),
          })
          .catch(() => {
            // Swallow network-level rejections only: apiClient.fetch
            // resolves on non-2xx HTTP statuses (returns the Response)
            // but rejects on a genuine transport failure (DNS, connection
            // refused, CORS). The optimistic local state + cookie mirror
            // already applied, so the UI stays correct and the next /me
            // hydration re-syncs — same recovery path as a failed PUT.
          });
      }}
      onSettingsClick={() => navigate('/admin/settings')}
      onLogoutClick={() => {
        void auth.logout();
      }}
    >
      <Outlet />
    </AppShell>
  );
}

/**
 * App
 *
 * Root component that configures the application's route hierarchy.
 * All routes are wrapped in TrailingSlashRedirect to enforce URL normalization,
 * ensuring that URLs ending with a trailing slash (e.g., '/garden-rooms/') are
 * redirected to their canonical form (e.g., '/garden-rooms') before rendering.
 *
 * @returns The complete route tree for the application.
 */
function App() {
  return (
    <Routes>
      {/*
        TrailingSlashRedirect wrapper:
        Intercepts all incoming routes and performs an in-place redirect
        (equivalent to HTTP 301) if the pathname ends with a trailing slash.
        This prevents duplicate content issues and ensures canonical URL
        consistency across the entire application.
      */}
      <Route element={<TrailingSlashRedirect />}>
        {/* Public Routes rendered dynamically from configuration */}
        <Route element={<TemplateLayout />}>
          {routes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/*
            Garden Room Configurator — dynamic route with :slug parameter.
            Each garden room product (compact-15, studio-25, living-35, grand-45)
            has its own configurator page at /garden-rooms/configure/:slug.
            The slug is resolved to a ConfiguratorProduct inside the component.
          */}
          <Route path="/garden-rooms/configure/:slug" element={<GardenRoomConfigurator />} />

          {/* SEO: Redirect singular /garden-room to canonical /garden-rooms (plural) */}
          <Route path="/garden-room" element={<Navigate to="/garden-rooms" replace />} />
          <Route path="/garden-room/configure/:slug" element={<GardenRoomConfigureRedirect />} />

          {/* SEO: Redirect singular /house-extension to canonical /house-extensions (plural) */}
          <Route path="/house-extension" element={<Navigate to="/house-extensions" replace />} />
        </Route>

        {/*
          Admin panel (012-panel-phase-1) — pre-auth pages render standalone,
          each scoped in its own .admin-root wrapper. Every protected
          destination sits behind AuthProvider + AdminGuard inside the shared
          AppShell (sidebar + 48px top bar), matched via nested routes so
          AdminShell's <Outlet /> swaps only the main content region.
        */}
        <Route path="/admin/login" element={<LoginContainer />} />
        <Route path="/admin/two-factor" element={<TwoFactorContainer />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordContainer />} />
        <Route path="/admin/reset-password" element={<ResetPasswordContainer />} />
        <Route
          path="/admin"
          element={
            <AuthProvider>
              <AdminRoot>
                <AdminGuard>
                  <AdminShell />
                </AdminGuard>
              </AdminRoot>
            </AuthProvider>
          }
        >
          {/* No dashboard/widgets in Phase 1 (plan §5.2) — the index route
              lands on the one real destination, Settings. */}
          <Route index element={<Navigate to="/admin/settings" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin/settings" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App