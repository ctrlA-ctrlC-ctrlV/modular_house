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

import type { ReactNode } from 'react'
import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { TemplateLayout } from './components/TemplateLayout'
import { TrailingSlashRedirect } from './components/TrailingSlashRedirect'
import { routes } from './route-config'
import GardenRoomConfigurator from './routes/GardenRoomConfigurator'

// Admin panel — pre-auth pages, the authenticated shell, and the auth/guard
// providers (012-panel-phase-1). `admin.css` is imported once here so the
// Tailwind v4 + OKLCH token layer is scoped to `.admin-root` throughout the
// whole admin subtree without ever reaching the public Bootstrap pages above.
import './admin/theme/admin.css'
import { AuthProvider, useAuth } from './admin/auth/AuthProvider'
import { AdminGuard } from './admin/auth/guard'
import { AppShell } from './admin/shell/AppShell'
import type { UserShellData } from './admin/shell/UserSection'
import { Login } from './admin/pages/Login'
import { TwoFactor } from './admin/pages/TwoFactor'
import { ForgotPassword } from './admin/pages/ForgotPassword'
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
        <Route path="/admin/login" element={<AdminRoot><Login /></AdminRoot>} />
        <Route path="/admin/two-factor" element={<AdminRoot><TwoFactor /></AdminRoot>} />
        <Route path="/admin/forgot-password" element={<AdminRoot><ForgotPassword /></AdminRoot>} />
        <Route path="/admin/reset-password" element={<AdminRoot><ResetPassword /></AdminRoot>} />
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