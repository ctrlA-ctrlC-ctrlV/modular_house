/**
 * CookieBanner — public-site cookie notice component (Phase 2, plan §2.1 K4,
 * §2.2 N1–N5, research R8).
 *
 * A non-blocking, fixed-position bottom overlay that informs visitors the site
 * uses performance cookies only (besides strictly-necessary ones), offers an
 * acknowledge button and a close ("x") control — both writing the
 * `mh_cookie_ack` acknowledgment cookie through a single seam (FR-028
 * extension point) — and links to the `/cookie-policy` page. The banner
 * renders only while `mh_cookie_ack` is absent and mounts client-side only
 * (N2 — absent from prerendered HTML).
 *
 * Styling: Bootstrap 5.3 classes (the public site's existing styling, imported
 * via `main.tsx`). The admin design system (Tailwind / OKLCH tokens) MUST NOT
 * leak into the public site (research R8, Phase 1 isolation rule).
 *
 * Accessibility (N5): `role="region"` + `aria-label="Cookie notice"`, both
 * controls are native `<button>` elements (keyboard reachable and operable),
 * no focus trap (the container has no `tabindex` that would capture focus),
 * visible focus via the browser's native `:focus-visible` ring on buttons.
 *
 * Cookie (K4): `mh_cookie_ack` value `"1"`, Max-Age 365 days, `Path=/`,
 * `SameSite=Lax`, `Secure` in production. Set by BOTH the acknowledge button
 * and the close ("x") control — there is no dismissal path that skips the
 * cookie (N3).
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Exported constants — extension points (Open-Closed).
// ---------------------------------------------------------------------------

/**
 * The acknowledgment cookie name (plan §2.1 K4). Exported so the
 * register-consistency test (T053) can assert every cookie name Phase 2 code
 * sets appears in the authoritative register without hardcoding the string.
 */
export const ACK_COOKIE_NAME = 'mh_cookie_ack';

// ---------------------------------------------------------------------------
// Pinned duration (plan §2.1 K4) — seconds, for the `max-age` attribute.
// ---------------------------------------------------------------------------

/** 365 days in seconds (K4 — `mh_cookie_ack` Max-Age). */
const ACK_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Cookie read/write helpers.
// ---------------------------------------------------------------------------

/**
 * Whether the `mh_cookie_ack` cookie is present with value `"1"`. The banner
 * renders only while this returns `false` (K4, N2).
 */
function isAcknowledged(): boolean {
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .some((part) => part === `${ACK_COOKIE_NAME}=1`);
}

/**
 * Write the `mh_cookie_ack` cookie with the pinned K4 attributes: value `"1"`,
 * 365-day Max-Age, `Path=/`, `SameSite=Lax`, `Secure` in production only (the
 * `Secure` attribute would prevent the cookie from being set over plain HTTP,
 * breaking local dev and the test environment).
 */
function setAckCookie(): void {
  const parts = [
    `${ACK_COOKIE_NAME}=1`,
    `max-age=${ACK_MAX_AGE_SECONDS}`,
    'path=/',
    'samesite=lax',
  ];
  if (import.meta.env.PROD) {
    parts.push('secure');
  }
  document.cookie = parts.join('; ');
}

// ---------------------------------------------------------------------------
// CookieBanner component.
// ---------------------------------------------------------------------------

/**
 * Cookie notice banner for the public site.
 *
 * Mounts client-side only (N2): the `mounted` flag starts `false` and flips to
 * `true` inside `useEffect`, so the banner is absent from server-rendered /
 * prerendered HTML and appears only after hydration. The `acknowledged` flag
 * tracks the cookie so the banner hides immediately on click (N3 — same frame)
 * and stays hidden on remounts while the cookie persists.
 *
 * The `acknowledge` callback is the FR-028 extension-point seam: both controls
 * call it, and a future opt-in accept/decline model would extend this single
 * function without replacing the component.
 */
export function CookieBanner() {
  // N2: client-only mount — `mounted` stays false during SSR/prerender so the
  // banner never appears in the static HTML crawled by search engines (R8,
  // SC-003). It flips to `true` after the first client-side effect.
  const [mounted, setMounted] = useState(false);

  // Tracks whether the visitor has already acknowledged. Updated from the
  // cookie on mount and synchronously on click so the banner hides in the
  // same frame (N3).
  const [acknowledged, setAcknowledged] = useState(false);

  // Read the cookie after mount (client-side only — `document.cookie` is not
  // available during SSR). Both state updates are batched in a single effect
  // so there is no flash of banner for already-acknowledged visitors.
  useEffect(() => {
    setMounted(true);
    setAcknowledged(isAcknowledged());
  }, []);

  // FR-028: single acknowledgment seam. Both the acknowledge button and the
  // close ("x") control call this function. A future opt-in model would
  // extend this seam (e.g. branch on which control was activated) without
  // replacing the component.
  const acknowledge = useCallback(() => {
    setAckCookie();
    setAcknowledged(true);
  }, []);

  // Render nothing during SSR (before mount) or when already acknowledged.
  if (!mounted || acknowledged) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed-bottom bg-dark text-light border-top"
      data-testid="cookie-banner"
    >
      <div className="container d-flex align-items-center justify-content-between gap-3 py-2">
        <p className="mb-0 small">
          We use performance cookies and strictly necessary cookies to
          understand how visitors use our site.{' '}
          <Link
            to="/cookie-policy"
            className="text-info text-decoration-underline"
          >
            Cookie Policy
          </Link>
        </p>
        <div className="d-flex align-items-center gap-2 shrink-0">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={acknowledge}
          >
            Acknowledge
          </button>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={acknowledge}
          />
        </div>
      </div>
    </div>
  );
}
