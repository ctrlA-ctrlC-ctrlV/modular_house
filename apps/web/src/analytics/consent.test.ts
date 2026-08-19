/**
 * consent.ts unit tests (FR-028 extension-point module).
 *
 * Asserts the shared cookie-consent module in isolation from any component
 * that consumes it (`CookieBanner`, `beacon.ts`, `GoogleTag.tsx`):
 *   - `getCookieConsent` / `setCookieConsent` — the persistent choice cookie
 *     round-trips both values with the pinned 365-day Max-Age/Path/SameSite
 *     attributes, and an absent or unrecognised cookie value reads as `null`.
 *   - `dismissBannerForSession` — writes a true browser session cookie (no
 *     Max-Age/Expires attribute at all).
 *   - `shouldShowBanner` — true only when neither cookie is present.
 *   - `hasAnalyticsConsent` — default-deny: true only for the explicit
 *     `'accepted'` choice.
 *   - `clearCookieConsent` — clears both cookies.
 *   - `subscribeToConsentChange` — fires on every mutating call and stops
 *     firing after unsubscribe.
 *
 * Determinism (constitution III): a controlled `document.cookie` override
 * captures every write's full attribute string, matching the pattern used in
 * `beacon.test.ts` and `CookieBanner.test.tsx`. No real timers, no network.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  ACK_COOKIE_NAME,
  DISMISS_COOKIE_NAME,
  getCookieConsent,
  setCookieConsent,
  dismissBannerForSession,
  isBannerDismissedForSession,
  shouldShowBanner,
  hasAnalyticsConsent,
  clearCookieConsent,
  subscribeToConsentChange,
} from './consent';

// ---------------------------------------------------------------------------
// Controlled document.cookie store — same pattern as CookieBanner.test.tsx.
// ---------------------------------------------------------------------------
let cookieStore = new Map<string, string>();
let cookieSetCalls: string[] = [];

beforeAll(() => {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () =>
      Array.from(cookieStore.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    set: (value: string) => {
      cookieSetCalls.push(value);
      const segments = value.split(';').map((segment) => segment.trim());
      const pair = segments[0] ?? '';
      const eq = pair.indexOf('=');
      if (eq < 0) return;
      const name = pair.slice(0, eq);
      const rawValue = pair.slice(eq + 1);
      const maxAgeAttr = segments.find((attr) =>
        attr.toLowerCase().startsWith('max-age='),
      );
      if (maxAgeAttr && Number(maxAgeAttr.split('=')[1]) <= 0) {
        cookieStore.delete(name);
      } else {
        cookieStore.set(name, rawValue);
      }
    },
  });
});

const ACK_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 31536000

/** Full attribute strings written for a given cookie name, in write order. */
function cookieWritesFor(name: string): string[] {
  return cookieSetCalls.filter((write) => write.startsWith(`${name}=`));
}

beforeEach(() => {
  cookieStore = new Map();
  cookieSetCalls = [];
});

// ---------------------------------------------------------------------------
// getCookieConsent / setCookieConsent.
// ---------------------------------------------------------------------------

describe('getCookieConsent / setCookieConsent', () => {
  it('returns null when no choice has been made', () => {
    expect(getCookieConsent()).toBeNull();
  });

  it('returns null for an unrecognised cookie value (defensive read)', () => {
    cookieStore.set(ACK_COOKIE_NAME, 'garbage');
    expect(getCookieConsent()).toBeNull();
  });

  it('sets mh_cookie_ack=accepted with a 365-day Max-Age, Path=/, SameSite=Lax', () => {
    setCookieConsent('accepted');

    expect(getCookieConsent()).toBe('accepted');
    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_ack=accepted/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);
  });

  it('sets mh_cookie_ack=necessary with the same pinned attributes', () => {
    setCookieConsent('necessary');

    expect(getCookieConsent()).toBe('necessary');
    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes[0]).toMatch(/mh_cookie_ack=necessary/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
  });

  it('a later call overwrites an earlier choice', () => {
    setCookieConsent('accepted');
    setCookieConsent('necessary');
    expect(getCookieConsent()).toBe('necessary');
  });
});

// ---------------------------------------------------------------------------
// dismissBannerForSession / isBannerDismissedForSession.
// ---------------------------------------------------------------------------

describe('dismissBannerForSession', () => {
  it('writes mh_cookie_dismissed=1 as a true session cookie (no Max-Age attribute)', () => {
    dismissBannerForSession();

    expect(isBannerDismissedForSession()).toBe(true);
    const writes = cookieWritesFor(DISMISS_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_dismissed=1/);
    expect(writes[0]).not.toMatch(/max-age/i);
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);
  });

  it('does not affect the persistent consent choice', () => {
    dismissBannerForSession();
    expect(getCookieConsent()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// shouldShowBanner.
// ---------------------------------------------------------------------------

describe('shouldShowBanner', () => {
  it('is true when neither cookie is present', () => {
    expect(shouldShowBanner()).toBe(true);
  });

  it('is false once a persistent choice is made (accepted)', () => {
    setCookieConsent('accepted');
    expect(shouldShowBanner()).toBe(false);
  });

  it('is false once a persistent choice is made (necessary)', () => {
    setCookieConsent('necessary');
    expect(shouldShowBanner()).toBe(false);
  });

  it('is false once the banner is dismissed for the session, even without a persistent choice', () => {
    dismissBannerForSession();
    expect(shouldShowBanner()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasAnalyticsConsent — default-deny.
// ---------------------------------------------------------------------------

describe('hasAnalyticsConsent (default-deny)', () => {
  it('is false when no choice has been made', () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('is false when the visitor chose necessary cookies only', () => {
    setCookieConsent('necessary');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('is false during a same-session dismissal (no persistent choice)', () => {
    dismissBannerForSession();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('is true only after an explicit accepted choice', () => {
    setCookieConsent('accepted');
    expect(hasAnalyticsConsent()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clearCookieConsent.
// ---------------------------------------------------------------------------

describe('clearCookieConsent', () => {
  it('clears both the persistent choice and the session dismissal', () => {
    setCookieConsent('accepted');
    dismissBannerForSession();

    clearCookieConsent();

    expect(getCookieConsent()).toBeNull();
    expect(isBannerDismissedForSession()).toBe(false);
    expect(shouldShowBanner()).toBe(true);
  });

  it('is a no-op-safe call when nothing was set', () => {
    expect(() => clearCookieConsent()).not.toThrow();
    expect(shouldShowBanner()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// subscribeToConsentChange.
// ---------------------------------------------------------------------------

describe('subscribeToConsentChange', () => {
  it('notifies the listener when a persistent choice is set', () => {
    const listener = vi.fn();
    subscribeToConsentChange(listener);

    setCookieConsent('accepted');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies the listener when the banner is dismissed for the session', () => {
    const listener = vi.fn();
    subscribeToConsentChange(listener);

    dismissBannerForSession();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('notifies the listener when consent is cleared', () => {
    const listener = vi.fn();
    subscribeToConsentChange(listener);

    clearCookieConsent();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after the returned unsubscribe function is called', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToConsentChange(listener);

    unsubscribe();
    setCookieConsent('accepted');

    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple independent subscribers', () => {
    const first = vi.fn();
    const second = vi.fn();
    subscribeToConsentChange(first);
    subscribeToConsentChange(second);

    setCookieConsent('necessary');

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
