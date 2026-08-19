/**
 * Cookie-consent module (Phase 2, plan §2.1 K4, FR-028 extension point).
 *
 * Single source of truth for the visitor's cookie-consent state, shared by
 * every consent-gated feature: `CookieBanner` (the UI that collects the
 * choice), `beacon.ts` (the first-party analytics beacon), and
 * `GoogleTag.tsx` (Google Analytics). This module is the FR-028 seam the
 * banner's original docstring reserved for "a future opt-in accept/decline
 * model": a future consent-gated feature reads {@link hasAnalyticsConsent}
 * and/or subscribes via {@link subscribeToConsentChange} and requires no
 * other module to change (Open-Closed).
 *
 * Two cookies model the visitor's state:
 *   - `ACK_COOKIE_NAME` ('mh_cookie_ack') — the PERSISTENT explicit choice,
 *     value `'accepted' | 'necessary'`, 365-day Max-Age, `Path=/`,
 *     `SameSite=Lax`, `Secure` in production. Written only by the banner's
 *     "Accept All" / "Necessary Cookies Only" buttons, and cleared by the
 *     Cookie Policy page's "Change Cookie Preferences" control.
 *   - `DISMISS_COOKIE_NAME` ('mh_cookie_dismissed') — a true browser SESSION
 *     cookie (no `max-age`/`expires` attribute at all, so the browser drops
 *     it on close), value `"1"`. Written only by the banner's close ("x")
 *     control: it silences the banner for the remainder of the current
 *     browsing session without recording a lasting choice, so the banner
 *     asks again next session. Strictly-necessary category — it is banner UX
 *     state, not tracking.
 *
 * {@link hasAnalyticsConsent} is default-deny: it is `true` only when the
 * persistent cookie's value is exactly `'accepted'`. Every other state —
 * absent, `'necessary'`, or dismissed-this-session — denies analytics, which
 * is what makes a same-session close ("x") behave as necessary-only with no
 * extra branching anywhere else in the codebase.
 */

/** The two persistent choices a visitor can make via the banner's buttons. */
export type CookieConsentChoice = 'accepted' | 'necessary';

/**
 * The persistent consent-choice cookie name (plan §2.1 K4). Exported so the
 * register-consistency test can assert the name appears in the authoritative
 * register without hardcoding the string.
 */
export const ACK_COOKIE_NAME = 'mh_cookie_ack';

/**
 * The session-scoped "dismissed without choosing" cookie name. Exported for
 * the same register-consistency reason as {@link ACK_COOKIE_NAME}.
 */
export const DISMISS_COOKIE_NAME = 'mh_cookie_dismissed';

/** 365 days in seconds (K4 — `mh_cookie_ack` Max-Age). */
const ACK_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/**
 * The `window` event name used to notify sibling components of a consent
 * change made elsewhere (e.g. the Cookie Policy page's "Change Cookie
 * Preferences" control clearing the choice while `CookieBanner` is already
 * mounted). Module-private: consumers use {@link subscribeToConsentChange}
 * rather than listening for this event directly.
 */
const CONSENT_CHANGE_EVENT = 'mh-cookie-consent-change';

// ---------------------------------------------------------------------------
// Cookie read/write/delete helpers.
// ---------------------------------------------------------------------------

/** Read a cookie value by name from `document.cookie`, or `undefined` if absent. */
function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

/**
 * Write a cookie. `maxAgeSeconds` is omitted for a true browser session
 * cookie (no `max-age`/`expires` attribute — cleared when the browser
 * closes); when provided it sets the persistent expiry. `Path=/` and
 * `SameSite=Lax` are always applied, with `Secure` added in production only
 * (it would prevent the cookie from being set over plain HTTP, breaking
 * local dev and the test environment).
 */
function writeCookie(name: string, value: string, maxAgeSeconds?: number): void {
  const parts = [`${name}=${value}`];
  if (typeof maxAgeSeconds === 'number') {
    parts.push(`max-age=${maxAgeSeconds}`);
  }
  parts.push('path=/', 'samesite=lax');
  if (import.meta.env.PROD) {
    parts.push('secure');
  }
  document.cookie = parts.join('; ');
}

/** Delete a cookie by writing it with an immediately-expiring Max-Age. */
function deleteCookie(name: string): void {
  document.cookie = `${name}=; max-age=0; path=/`;
}

// ---------------------------------------------------------------------------
// Change notification — pub/sub over a window CustomEvent.
// ---------------------------------------------------------------------------

/**
 * Notify subscribers that the consent state changed. Dispatched synchronously
 * so a same-page "Accept All" click can be observed by `useBeacon`/`GoogleTag`
 * within the same event-handler tick, letting them act immediately instead of
 * waiting for the next navigation or a page reload.
 */
function notifyConsentChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
  }
}

/**
 * Subscribe to consent-state changes. Returns an unsubscribe function, so
 * callers can use it directly as a `useEffect` cleanup return value.
 */
export function subscribeToConsentChange(listener: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener(CONSENT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
}

// ---------------------------------------------------------------------------
// Consent state — reads.
// ---------------------------------------------------------------------------

/** The visitor's persistent choice, or `null` if none has been made yet. */
export function getCookieConsent(): CookieConsentChoice | null {
  const value = readCookie(ACK_COOKIE_NAME);
  return value === 'accepted' || value === 'necessary' ? value : null;
}

/** Whether the banner was closed without a choice earlier in this browsing session. */
export function isBannerDismissedForSession(): boolean {
  return readCookie(DISMISS_COOKIE_NAME) === '1';
}

/**
 * Whether the banner should render: no persistent choice has been made, and
 * it was not already dismissed for the current session.
 */
export function shouldShowBanner(): boolean {
  return getCookieConsent() === null && !isBannerDismissedForSession();
}

/**
 * Whether performance/analytics cookies may be set. Default-deny: only the
 * explicit `'accepted'` choice grants this — an absent choice, a `'necessary'`
 * choice, and a same-session dismissal all deny it identically.
 */
export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}

// ---------------------------------------------------------------------------
// Consent state — writes.
// ---------------------------------------------------------------------------

/** Record the visitor's persistent choice (the banner's two main buttons). */
export function setCookieConsent(choice: CookieConsentChoice): void {
  writeCookie(ACK_COOKIE_NAME, choice, ACK_MAX_AGE_SECONDS);
  notifyConsentChange();
}

/** Silence the banner for the rest of the current session (the banner's close "x"). */
export function dismissBannerForSession(): void {
  writeCookie(DISMISS_COOKIE_NAME, '1');
  notifyConsentChange();
}

/**
 * Clear any recorded choice, so the banner reappears and analytics returns
 * to default-deny. Used by the Cookie Policy page's "Change Cookie
 * Preferences" control. Clears both cookies so the banner reappears
 * regardless of which control produced the current state.
 */
export function clearCookieConsent(): void {
  deleteCookie(ACK_COOKIE_NAME);
  deleteCookie(DISMISS_COOKIE_NAME);
  notifyConsentChange();
}
