/**
 * Public page-view beacon module (Phase 2, plan §2.1 K1–K3 / §2.3 M8, research R1/R2).
 *
 * Records one anonymous page-view event per public page display — on initial
 * document load and on each SPA navigation to a different `pathname` — and
 * maintains the two first-party identifier cookies that carry visitor/session
 * identity across page views. The module is fire-and-forget by construction:
 * every transport failure is swallowed, the public site never observes an
 * error or slowdown from measurement (FR-012, SC-009), and there are zero
 * retries (research R1).
 *
 * Cookies set (plan §2.1 K1–K3):
 *   - `mh_vid` — UUID v4, 365-day rolling Max-Age, renewed (same value, fresh
 *     expiry) on every measured page view; re-issued with a new value when
 *     absent. Identifies the visitor across days (K2).
 *   - `mh_sid` — UUID v4, 30-minute rolling Max-Age, renewed on every measured
 *     page view. The cookie expiry IS the 30-minute session inactivity window
 *     (K3/V1) — no server-side sessionisation is required.
 *   Both are `Path=/`, `SameSite=Lax`, and `Secure` in production (K1). They
 *   contain only random identifiers — no session/credential value (constitution I).
 *
 * Transport (plan §2.3 M8, research R1):
 *   `navigator.sendBeacon(url, blob)` is the primary transport (non-blocking,
 *   survives navigation); `fetch(url, { keepalive: true })` is the fallback when
 *   sendBeacon is unavailable or fails. The beacon ignores every response.
 *
 * Payload (plan §2.3 M2, research R3): `{ path, referrer?, utmSource?,
 * utmMedium?, utmCampaign?, adClick? }`. `referrer` is `document.referrer`
 * (the full URL — the API stores only the hostname via S5). `utmSource` /
 * `utmMedium` / `utmCampaign` are read from the URL search params when present.
 * `adClick` is a boolean set when the landing URL carries a known ad click-ID
 * parameter (`gclid`/`fbclid`); the click-ID VALUE itself is never transmitted
 * or stored (FR-015). All optional fields are omitted from the payload when
 * their source value is absent/empty.
 *
 * Admin exclusion (plan §2.3 M5, FR-014): `/admin` and `/admin/*` are never
 * measured — no cookie renewal, no dispatch — defence in depth on top of the
 * client skip (the API drops them too).
 *
 * The module performs no work at import time; the only entry points are the
 * `useBeacon` hook (mounted once in `TemplateLayout`, T052) and the pure
 * `sendPageView` function used by the hook and the unit suite. Importing the
 * module therefore adds nothing to the render-critical path (research R1).
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Exported constants — extension points (Open-Closed).
// ---------------------------------------------------------------------------

/**
 * Ad click-ID query-parameter names that mark an arrival as a paid ad click
 * (plan §2.3 M2, research R3). The beacon sets `adClick: true` when the landing
 * URL carries any of these; the parameter VALUE is never read into the payload
 * (FR-015). The list is extend-by-append: a future ad platform is added by
 * appending a parameter name here, with no other code change.
 */
export const AD_CLICK_PARAMS = ['gclid', 'fbclid'] as const;

/**
 * Public cookie names (plan §2.1 K1). Exported so the cookie-register
 * consistency test (T053) can assert that every cookie name Phase 2 code sets
 * appears in the authoritative register without hardcoding the strings twice.
 */
export const VISITOR_COOKIE_NAME = 'mh_vid';
export const SESSION_COOKIE_NAME = 'mh_sid';

// ---------------------------------------------------------------------------
// Pinned durations (plan §2.1 K2/K3) — seconds, for the `max-age` attribute.
// ---------------------------------------------------------------------------

/** 365 days in seconds (K2 — `mh_vid` rolling Max-Age). */
const VISITOR_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** 30 minutes in seconds (K3 — `mh_sid` rolling Max-Age = session window). */
const SESSION_MAX_AGE_SECONDS = 30 * 60;

// ---------------------------------------------------------------------------
// Ingest endpoint URL.
// ---------------------------------------------------------------------------

/**
 * Absolute ingest endpoint URL. Derived from the same `VITE_API_BASE_URL` env
 * variable the rest of the app uses (see `lib/apiClient.ts`); a trailing slash
 * is stripped so the path joins cleanly. Same-origin in production, so the
 * first-party `mh_vid`/`mh_sid` cookies flow with the request automatically
 * (research R3).
 */
const INGEST_URL = `${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/analytics/events`;

// ---------------------------------------------------------------------------
// Cookie read/write helpers.
// ---------------------------------------------------------------------------

/**
 * Read a cookie value by name from `document.cookie`. Returns `undefined` when
 * the cookie is absent. The browser exposes cookies only as `name=value` pairs
 * joined by `; ` (attributes are not readable back), so a simple split + trim
 * scan is sufficient.
 */
function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

/**
 * Write a cookie with the pinned Phase 2 attributes (K1): `Path=/`,
 * `SameSite=Lax`, and `Secure` in production only (the `Secure` attribute would
 * prevent the cookie from being set over plain HTTP, breaking local dev and the
 * test environment). `max-age` is given in seconds.
 */
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const parts = [
    `${name}=${value}`,
    `max-age=${maxAgeSeconds}`,
    'path=/',
    'samesite=lax',
  ];
  if (import.meta.env.PROD) {
    parts.push('secure');
  }
  document.cookie = parts.join('; ');
}

// ---------------------------------------------------------------------------
// Identifier ensure/renew — K2/K3 rolling expiry.
// ---------------------------------------------------------------------------

/**
 * Ensure a visitor identifier exists in the `mh_vid` cookie and renew its
 * expiry (K2). When the cookie is present its value is reused and the Max-Age
 * is refreshed to 365 days from now; when it is absent a fresh UUID v4 is minted
 * via `crypto.randomUUID` and stored. The returned value is the active visitor
 * id (the cookie is the source of truth between page views).
 */
function ensureVisitorId(): string {
  const existing = getCookie(VISITOR_COOKIE_NAME);
  if (existing) {
    setCookie(VISITOR_COOKIE_NAME, existing, VISITOR_MAX_AGE_SECONDS);
    return existing;
  }
  const id = crypto.randomUUID();
  setCookie(VISITOR_COOKIE_NAME, id, VISITOR_MAX_AGE_SECONDS);
  return id;
}

/**
 * Ensure a session identifier exists in the `mh_sid` cookie and renew its
 * expiry (K3). Same renewal semantics as `ensureVisitorId` but with a 30-minute
 * Max-Age — the cookie expiry itself implements the session inactivity window
 * (V1). An expired/absent cookie yields a new UUID, starting a new session.
 */
function ensureSessionId(): string {
  const existing = getCookie(SESSION_COOKIE_NAME);
  if (existing) {
    setCookie(SESSION_COOKIE_NAME, existing, SESSION_MAX_AGE_SECONDS);
    return existing;
  }
  const id = crypto.randomUUID();
  setCookie(SESSION_COOKIE_NAME, id, SESSION_MAX_AGE_SECONDS);
  return id;
}

// ---------------------------------------------------------------------------
// Admin-path guard — M5 / FR-014.
// ---------------------------------------------------------------------------

/**
 * Whether a pathname is an admin route that must never be measured (M5). Matches
 * `/admin` exactly and any path beginning with `/admin/`. A public page that
 * merely starts with the token "admin" (e.g. `/administration`) is NOT matched
 * and is measured — the boundary is the admin route prefix, not a substring.
 */
function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

// ---------------------------------------------------------------------------
// adClick detection — M2 / FR-015.
// ---------------------------------------------------------------------------

/**
 * Whether the URL search string carries a known ad click-ID parameter (M2).
 * Only the parameter's PRESENCE is checked — its value is never read, so the
 * click identifier can never leak into the payload (FR-015). Exported so the
 * unit suite can assert the behaviour directly against `AD_CLICK_PARAMS`.
 */
export function detectAdClick(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search);
  return AD_CLICK_PARAMS.some((param) => params.has(param));
}

// ---------------------------------------------------------------------------
// UTM parameter extraction — M2, research R3.
// ---------------------------------------------------------------------------

/**
 * Mapping from URL query-parameter names (snake_case, as used in campaign-
 * tagged URLs) to the ingest payload field names (camelCase, per the M2
 * contract / `ingestEventSchema`). Extend-by-append: a future UTM parameter
 * would add an entry here with no other code change (Open-Closed).
 */
const UTM_PARAM_MAP: Readonly<Record<string, string>> = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
};

/**
 * Extract the UTM campaign parameters from a URL search string, mapping them
 * to the M2 payload field names (M2, research R3). Returns an empty object
 * when the search string is empty or carries no UTM parameters. Only non-empty
 * values are included — an empty `utm_source=` is omitted, matching the M2
 * optional-field semantics.
 */
function extractUtmParams(
  search: string,
): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (!search) return {};
  const params = new URLSearchParams(search);
  const result: { utmSource?: string; utmMedium?: string; utmCampaign?: string } =
    {};
  for (const [urlParam, payloadField] of Object.entries(UTM_PARAM_MAP)) {
    const value = params.get(urlParam);
    if (value) {
      (result as Record<string, string>)[payloadField] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Transport — sendBeacon with keepalive-fetch fallback (M8, research R1).
// ---------------------------------------------------------------------------

/** No-op handler used to swallow both settle branches of the fetch fallback. */
const noop = (): void => {};

/**
 * Serialise and dispatch one page-view payload. `navigator.sendBeacon` is the
 * primary transport (non-blocking, survives navigation); the keepalive `fetch`
 * fallback fires only when sendBeacon is unavailable, throws, or returns false
 * (research R1). Every failure path is swallowed — no error surfaces to the
 * page (FR-012, SC-009) — and there is no retry: a failed dispatch is simply
 * lost (undercount is the accepted failure mode, research R1).
 *
 * The fetch fallback attaches both settle handlers synchronously so an
 * already-rejected promise can never become an unhandled rejection.
 */
function dispatch(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });

  let sent = false;
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      sent = navigator.sendBeacon(INGEST_URL, blob);
    } catch {
      // sendBeacon can throw on overly-large payloads or in rare browser quirks;
      // treat as not-sent and fall through to the keepalive fetch (research R1).
      sent = false;
    }
  }

  if (!sent) {
    try {
      const result = fetch(INGEST_URL, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      });
      // Swallow both resolution and rejection so a down API never surfaces an
      // unhandled promise rejection to the page (FR-012, SC-009).
      if (result && typeof result.then === 'function') {
        result.then(noop, noop);
      }
    } catch {
      // A synchronous throw from fetch (e.g. a blocked origin) is swallowed;
      // the page stays functional regardless of collection state (FR-012).
    }
  }
}

// ---------------------------------------------------------------------------
// sendPageView — the pure per-page-view entry point.
// ---------------------------------------------------------------------------

/**
 * Input shape for {@link sendPageView}. The hook supplies `pathname` and
 * `search` from the router; the unit suite calls `sendPageView` directly with
 * controlled values.
 */
export interface SendPageViewInput {
  /** Public page pathname (must start with `/`). */
  pathname: string;
  /** URL search string including the leading `?`, or empty. */
  search?: string;
}

/**
 * Record one page view: renew the visitor/session cookies, build the M2 payload,
 * and dispatch it fire-and-forget. Admin routes (`/admin`, `/admin/*`) short-
 * circuit before any cookie is touched or any dispatch is attempted (M5/FR-014).
 *
 * This function is pure with respect to React — it reads no router state and
 * triggers no render — so the {@link useBeacon} hook can call it from an effect
 * without coupling measurement to the render path.
 */
export function sendPageView(input: SendPageViewInput): void {
  // Admin routes are never measured: no cookies, no dispatch (M5, FR-014).
  if (isAdminPath(input.pathname)) return;

  // Renew both identifier cookies on every measured view (K2/K3 rolling
  // expiry). The cookie values are the source of truth the API reads back via
  // request cookies (M3).
  ensureVisitorId();
  ensureSessionId();

  // Build the M2 payload (research R3). `path` is always present; the
  // optional fields are included only when their source value is non-empty.
  const payload: Record<string, unknown> = { path: input.pathname };

  // Forward `document.referrer` when non-empty (M2, research R3, S5). The
  // browser sets this on navigation; it does not change during SPA route
  // changes, so every event carries the same referrer. The API stores only
  // the hostname via `extractReferrerHost` (S5) and classifies the traffic
  // source via `trafficSource.classify` (S1–S3). The session's source is
  // attributed from the first stored event (S4).
  const referrer = document.referrer;
  if (referrer) {
    payload.referrer = referrer;
  }

  // Forward UTM campaign parameters from the URL search string (M2, research
  // R3). These are typically present on the landing URL and drive CAMPAIGN
  // classification (S1).
  Object.assign(payload, extractUtmParams(input.search ?? ''));

  // `adClick` is added only when a known ad click-ID parameter is present on
  // the landing URL (M2/FR-015). The click-ID VALUE is never read.
  if (detectAdClick(input.search ?? '')) {
    payload.adClick = true;
  }

  dispatch(payload);
}

// ---------------------------------------------------------------------------
// useBeacon — the single mount point hook (T052 mounts it in TemplateLayout).
// ---------------------------------------------------------------------------

/**
 * React hook that fires one page-view beacon on initial mount and on each SPA
 * navigation to a different `pathname` (M8). The effect depends on
 * `location.pathname` only: a same-path navigation (search-only change, e.g. an
 * in-page gallery filter) is intentionally NOT a new page view and sends
 * nothing. The hook is mounted exactly once in `TemplateLayout` so every
 * current and future public page is measured with zero page-specific setup
 * (FR-001/SC-001); admin routes are skipped inside {@link sendPageView}.
 *
 * `location.search` is read inside the effect but deliberately omitted from the
 * dependency array so search-only changes do not re-trigger the beacon.
 */
export function useBeacon(): void {
  const location = useLocation();

  useEffect(() => {
    sendPageView({
      pathname: location.pathname,
      search: location.search,
    });
    // The effect re-runs only on a pathname change (M8); `location.search` is
    // intentionally excluded so same-path navigations send nothing.
  }, [location.pathname]);
}
