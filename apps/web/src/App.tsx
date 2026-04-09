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
 *
 * =============================================================================
 */

import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { TemplateLayout } from './components/TemplateLayout'
import { TrailingSlashRedirect } from './components/TrailingSlashRedirect'
import { routes } from './route-config'
import GardenRoomConfigurator from './routes/GardenRoomConfigurator'

import AdminLogin from './routes/admin/login'
import AdminDashboard from './routes/admin/index'
import AdminRedirects from './routes/admin/redirects'
import AdminGallery from './routes/admin/gallery'
import AdminSubmissions from './routes/admin/submissions'
import AdminPages from './routes/admin/pages'
import AdminGuard from './routes/admin/guard'

/** Redirect helper: forwards /garden-room/configure/:slug to /garden-rooms/configure/:slug */
function GardenRoomConfigureRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/garden-rooms/configure/${slug}`} replace />;
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

        {/* Admin Routes — also normalized for trailing slash consistency */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/redirects" element={<AdminRedirects />} />
          <Route path="/admin/gallery" element={<AdminGallery />} />
          <Route path="/admin/submissions" element={<AdminSubmissions />} />
          <Route path="/admin/pages" element={<AdminPages />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App