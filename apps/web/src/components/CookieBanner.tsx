/**
 * CookieBanner — public-site cookie notice component (Phase 2, plan §2.1 K4,
 * §2.2 N1–N5, research R8; opt-in model per FR-028).
 *
 * A non-blocking, fixed-position bottom overlay offering visitors a real
 * choice over performance cookies: "Accept All" or "Necessary Cookies Only",
 * plus a close ("x") control that silences the banner for the current
 * session only, without recording a lasting choice. All three controls read
 * and write through `analytics/consent.ts` (the FR-028 extension-point
 * module) rather than inlining cookie logic here. The banner links to the
 * `/cookie-policy` page and mounts client-side only (N2 — absent from
 * prerendered HTML).
 *
 * Styling: Bootstrap 5.3 classes (the public site's existing styling, imported
 * via `main.tsx`). The admin design system (Tailwind / OKLCH tokens) MUST NOT
 * leak into the public site (research R8, Phase 1 isolation rule).
 *
 * Accessibility (N5): `role="region"` + `aria-label="Cookie notice"`, all
 * three controls are native `<button>` elements (keyboard reachable and
 * operable), no focus trap (the container has no `tabindex` that would
 * capture focus), visible focus via the browser's native `:focus-visible`
 * ring on buttons.
 *
 * Consent semantics:
 *   - "Accept All" / "Necessary Cookies Only" record a persistent 365-day
 *     choice (`setCookieConsent`) — the banner never reappears while that
 *     choice stands.
 *   - Close ("x") calls `dismissBannerForSession` — a true browser session
 *     cookie with no expiry attribute, so the banner reappears next session.
 *     Analytics stays denied for the rest of the current session by the same
 *     default-deny rule that applies before any choice is made (no separate
 *     branching needed — see `analytics/consent.ts`).
 *   - The banner also subscribes to consent changes so it reappears
 *     immediately if a choice is cleared elsewhere (the Cookie Policy page's
 *     "Change Cookie Preferences" control), without needing a page reload.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  setCookieConsent,
  dismissBannerForSession,
  shouldShowBanner,
  subscribeToConsentChange,
} from '../analytics/consent';

// Re-exported so existing consumers (e.g. the cookie register's source
// comments) can still resolve the acknowledgment cookie name from this
// component; the value and its read/write logic now live in consent.ts,
// the single source of truth for consent state (FR-028 seam).
export { ACK_COOKIE_NAME } from '../analytics/consent';

// ---------------------------------------------------------------------------
// CookieBanner component.
// ---------------------------------------------------------------------------

/**
 * Cookie notice banner for the public site.
 *
 * Mounts client-side only (N2): the `mounted` flag starts `false` and flips to
 * `true` inside `useEffect`, so the banner is absent from server-rendered /
 * prerendered HTML and appears only after hydration. The `visible` flag
 * tracks whether the banner should currently render — derived from
 * `shouldShowBanner()` on mount and re-derived whenever a consent change is
 * observed (own click, or a change made elsewhere) — so the banner hides
 * immediately on click (same frame) and reappears immediately if consent is
 * cleared elsewhere.
 */
export function CookieBanner() {
  // N2: client-only mount — `mounted` stays false during SSR/prerender so the
  // banner never appears in the static HTML crawled by search engines (R8,
  // SC-003). It flips to `true` after the first client-side effect.
  const [mounted, setMounted] = useState(false);

  // Whether the banner should currently render, derived from the persistent
  // choice and session-dismissal cookies (consent.ts).
  const [visible, setVisible] = useState(false);

  // Read consent state after mount (client-side only — `document.cookie` is
  // not available during SSR) and subscribe to later changes so the banner
  // reacts to a choice made through another mounted instance of the consent
  // module (e.g. the Cookie Policy page's "Change Cookie Preferences"
  // control clearing the choice while this banner is already on screen).
  useEffect(() => {
    setMounted(true);
    setVisible(shouldShowBanner());
    return subscribeToConsentChange(() => {
      setVisible(shouldShowBanner());
    });
  }, []);

  // "Accept All" — records a persistent choice granting performance cookies.
  const acceptAll = useCallback(() => {
    setCookieConsent('accepted');
    setVisible(false);
  }, []);

  // "Necessary Cookies Only" — records a persistent choice denying
  // performance cookies.
  const necessaryOnly = useCallback(() => {
    setCookieConsent('necessary');
    setVisible(false);
  }, []);

  // Close ("x") — silences the banner for the current session only, with no
  // lasting choice recorded, so the banner asks again next session.
  const closeForSession = useCallback(() => {
    dismissBannerForSession();
    setVisible(false);
  }, []);

  // Render nothing during SSR (before mount) or while a choice/dismissal
  // already suppresses the banner.
  if (!mounted || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed-bottom bg-dark text-light border-top"
      data-testid="cookie-banner"
    >
      <div className="container d-flex align-items-center justify-content-between gap-3 py-2 flex-wrap">
        {/*
          text-light is required explicitly, not inherited from the parent's
          bg-dark/text-light pair: the site's global stylesheet sets
          `p { color: var(--brand-slate) }` (style.css), and an element's own
          explicit color declaration always wins over an inherited value
          regardless of selector specificity. Without this class the paragraph
          renders --brand-slate (#555555) on bg-dark (#212529), a 2.06:1
          contrast ratio that fails WCAG AA's 4.5:1 floor (N5) — caught live
          via Lighthouse/real-Chrome color-contrast audit, not jest-axe/jsdom,
          which does not compute rendered CSS color values (T126/T127).
        */}
        <p className="mb-0 small text-light">
          We use strictly necessary cookies to run this site, and optional
          performance cookies to understand how visitors use it. Choose
          Accept All to allow both, or Necessary Cookies Only to keep just
          the strictly necessary ones.{' '}
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
            onClick={acceptAll}
          >
            Accept All
          </button>
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={necessaryOnly}
          >
            Necessary Cookies Only
          </button>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={closeForSession}
          />
        </div>
      </div>
    </div>
  );
}
