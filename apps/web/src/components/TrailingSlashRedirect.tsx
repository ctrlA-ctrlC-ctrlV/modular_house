/**
 * TrailingSlashRedirect Component
 * =============================================================================
 *
 * PURPOSE:
 * Enforces URL normalization by stripping trailing slashes from all pathname
 * segments except the root path ('/'). This component runs as a declarative
 * router guard, executing before any child routes render.
 *
 * RATIONALE:
 * Google Search Console treats URLs with and without trailing slashes as
 * distinct pages. When both variants exist and no canonical preference is
 * declared, crawlers may index duplicates or follow redirect chains that
 * consume crawl budget. By normalizing all non-root URLs to the no-trailing-
 * slash format at the application level, this component ensures:
 *   - Consistent internal linking (no dual-URL indexing).
 *   - Reduced redirect latency for direct URL access.
 *   - Alignment with the canonical URLs declared in routes-metadata.ts.
 *
 * BEHAVIOUR:
 * - If the current pathname ends with '/' and is NOT the root path, the
 *   component renders a <Navigate> element with the `replace` prop, which
 *   performs an in-place history replacement. This mirrors a 301 permanent
 *   redirect at the HTTP level (no back-button pollution).
 * - If the pathname is already normalized, the component renders its children
 *   (typically an <Outlet>) unchanged.
 *
 * USAGE:
 * Wrap route trees that require normalization:
 *   <Route element={<TrailingSlashRedirect />}>
 *     <Route path="/" element={<Home />} />
 *     <Route path="/garden-room" element={<GardenRoom />} />
 *   </Route>
 *
 * DEPENDENCIES:
 * - react-router-dom: useLocation, Navigate
 *
 * =============================================================================
 */

import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Props interface for TrailingSlashRedirect component.
 * Extends the Open-Closed Principle by allowing optional customization.
 */
export interface TrailingSlashRedirectProps {
  /**
   * Optional child elements to render when no redirect is required.
   * Defaults to <Outlet /> if not provided, enabling seamless route nesting.
   */
  children?: React.ReactNode;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determines whether a given pathname requires trailing slash removal.
 *
 * The root path ('/') is excluded because '/' is the canonical representation
 * of the homepage and cannot be shortened further without breaking semantics.
 *
 * @param pathname - The URL pathname to evaluate.
 * @returns True if the pathname has a removable trailing slash; false otherwise.
 */
function hasRemovableTrailingSlash(pathname: string): boolean {
  return pathname.length > 1 && pathname.endsWith('/');
}

/**
 * Removes the trailing slash from a pathname.
 *
 * This function assumes the caller has already verified via
 * hasRemovableTrailingSlash() that the pathname is longer than one character
 * and ends with '/'. No additional validation is performed.
 *
 * @param pathname - The pathname to normalize.
 * @returns The pathname with the trailing slash removed.
 */
function removeTrailingSlash(pathname: string): string {
  return pathname.slice(0, -1);
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * TrailingSlashRedirect
 *
 * A route-level guard component that normalizes URLs by redirecting paths
 * with trailing slashes to their canonical no-trailing-slash equivalents.
 *
 * Renders a <Navigate replace /> when a redirect is required, preserving
 * the query string and hash fragments. Renders children (or <Outlet /> by
 * default) when the URL is already normalized.
 *
 * @param props - Component properties conforming to TrailingSlashRedirectProps.
 * @returns A Navigate element for redirect, or the children/Outlet for rendering.
 */
export const TrailingSlashRedirect: React.FC<TrailingSlashRedirectProps> = ({
  children,
}) => {
  const location = useLocation();

  // Evaluate whether the current pathname requires normalization.
  // The root path '/' is excluded from normalization.
  if (hasRemovableTrailingSlash(location.pathname)) {
    // Construct the normalized URL by removing the trailing slash and
    // preserving the search (query string) and hash fragments intact.
    const normalizedUrl =
      removeTrailingSlash(location.pathname) + location.search + location.hash;

    // Perform an in-place navigation (replace) to avoid polluting browser
    // history with redirect entries. This mirrors HTTP 301 behaviour where
    // the original URL is not added to the navigation stack.
    return <Navigate to={normalizedUrl} replace />;
  }

  // No redirect required — render children or a default Outlet for nested routes.
  return <>{children ?? <Outlet />}</>;
};

export default TrailingSlashRedirect;
