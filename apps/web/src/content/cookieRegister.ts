/**
 * cookieRegister.ts
 *
 * The single authoritative source of truth for every cookie the product sets
 * — public site and admin panel alike (plan §2.1 K5, research R9, FR-025).
 * `CookiePolicy` renders its table directly from this array with no copy of
 * the data (N4); the register-consistency suite (T053) asserts every cookie
 * name the codebase can actually set appears here, and that this list
 * contains no name outside the K5-pinned set.
 *
 * Design rules (mirrors routes-metadata.ts's Open-Closed convention):
 * - No React imports, no JSX, no DOM references — a plain data module that
 *   stays prerenderable with zero data dependency (research R9).
 * - Extend-by-append: a future cookie is documented by appending an entry
 *   here; the banner and policy page never need redesign (FR-027).
 *
 * Cookie-name literals below are NOT re-exported from the modules that set
 * them (`beacon.ts`, `CookieBanner.tsx`) to avoid a content-module ->
 * component-module dependency running backwards through the codebase; each
 * entry instead cites its source file/constant in a comment so the two stay
 * auditable side by side. The T053 consistency suite closes the loop by
 * importing the real constants from their owning modules and asserting they
 * appear in this array.
 */

/**
 * The three cookie categories a visitor-facing register may declare
 * (spec FR-025). Every entry below MUST use exactly one of these values.
 */
export type CookieCategory = 'strictly-necessary' | 'functional' | 'performance';

/**
 * One row of the cookie register — mirrors the four columns the policy page
 * table renders (name, purpose, category, duration) plus `setBy`, which
 * distinguishes first-party cookies set by this site from third-party
 * cookies set by a retained tag (Google Analytics, K5).
 */
export interface CookieRegisterEntry {
  /** The exact cookie name as it appears in the `Set-Cookie` header or `document.cookie`. */
  readonly name: string;
  /** Plain-language description of what the cookie is used for. */
  readonly purpose: string;
  /** One of the three FR-025 categories. */
  readonly category: CookieCategory;
  /** Plain-language duration (e.g. "365 days", "30 minutes"). */
  readonly duration: string;
  /** Who sets the cookie — this site, or a named third-party service. */
  readonly setBy: string;
}

/**
 * The complete cookie register (plan §2.1 K5). Order matches K5's own
 * grouping: the three public first-party cookies, the Phase 1 admin cookies,
 * then the retained Google Analytics cookies.
 */
export const COOKIE_REGISTER: readonly CookieRegisterEntry[] = [
  // ---------------------------------------------------------------------------
  // Public site — first-party cookies set by beacon.ts and CookieBanner.tsx
  // (plan §2.1 K1-K4).
  // ---------------------------------------------------------------------------
  {
    // Source: apps/web/src/analytics/beacon.ts -> VISITOR_COOKIE_NAME
    name: 'mh_vid',
    purpose:
      'Identifies a returning visitor across page views, so anonymous traffic measurement can distinguish new from returning visitors. Contains only a random identifier — no personal data.',
    category: 'performance',
    duration: '365 days',
    setBy: 'Modular House',
  },
  {
    // Source: apps/web/src/analytics/beacon.ts -> SESSION_COOKIE_NAME
    name: 'mh_sid',
    purpose:
      'Groups a visitor\'s page views into a single browsing session for anonymous traffic measurement. Contains only a random identifier — no personal data.',
    category: 'performance',
    duration: '30 minutes (rolling — renewed on each measured page view)',
    setBy: 'Modular House',
  },
  {
    // Source: apps/web/src/components/CookieBanner.tsx -> ACK_COOKIE_NAME
    name: 'mh_cookie_ack',
    purpose:
      'Records that the visitor has acknowledged the cookie notice, so the banner does not reappear on later visits.',
    category: 'strictly-necessary',
    duration: '365 days',
    setBy: 'Modular House',
  },

  // ---------------------------------------------------------------------------
  // Admin panel — cookies set only for signed-in administrators; no
  // visitor-facing banner (FR-026).
  // ---------------------------------------------------------------------------
  {
    // Source: apps/api/src/routes/admin/auth.ts -> res.cookie('refreshToken', ...)
    name: 'refreshToken',
    purpose:
      'Keeps a signed-in administrator authenticated between visits by carrying a session refresh token. httpOnly — never readable by page scripts.',
    category: 'strictly-necessary',
    duration: '7 days',
    setBy: 'Modular House',
  },
  {
    // Source: apps/web/src/admin/theme/ThemeProvider.tsx -> THEME_COOKIE
    name: 'admin_theme_mode',
    purpose: 'Remembers a signed-in administrator\'s light/dark theme preference for the admin panel.',
    category: 'functional',
    duration: '30 days',
    setBy: 'Modular House',
  },
  {
    // Source: apps/web/src/admin/theme/ThemeProvider.tsx -> SIDEBAR_COOKIE
    name: 'admin_sidebar_collapsed',
    purpose: 'Remembers whether a signed-in administrator has collapsed or expanded the admin panel\'s sidebar.',
    category: 'functional',
    duration: '30 days',
    setBy: 'Modular House',
  },
  {
    // Source: apps/web/src/admin/ui/sidebar.tsx (legacy shadcn/ui SidebarProvider mirror)
    name: 'sidebar_state',
    purpose:
      'Legacy mirror of the admin panel sidebar\'s collapsed/expanded state, inherited from the underlying sidebar component library.',
    category: 'functional',
    duration: '7 days',
    setBy: 'Modular House',
  },

  // ---------------------------------------------------------------------------
  // Google Analytics — set by the retained GoogleTag component (plan §2.1 K5).
  // Documenting these entries does not touch GoogleTag.tsx or its
  // VITE_GA_TRACKING_ID plumbing (guardrail, plan §1.4).
  // ---------------------------------------------------------------------------
  {
    name: '_ga',
    purpose: 'Google Analytics — distinguishes unique visitors for site-usage measurement.',
    category: 'performance',
    duration: '2 years (renewed per visit; browsers may cap the effective lifetime at ~400 days)',
    setBy: 'Google Analytics',
  },
  {
    // The suffix is the GA4 property's measurement/container ID, which is
    // environment-specific; the register documents the name pattern rather
    // than a single literal value (research R9).
    name: '_ga_<container-id>',
    purpose: 'Google Analytics — persists session state for this site\'s GA4 property.',
    category: 'performance',
    duration: '2 years (renewed per visit; browsers may cap the effective lifetime at ~400 days)',
    setBy: 'Google Analytics',
  },
];
