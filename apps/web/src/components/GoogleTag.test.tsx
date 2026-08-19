/**
 * GoogleTag consent-gating tests (FR-028 — no prior suite existed for this
 * component; Google Analytics previously injected unconditionally).
 *
 * Asserts that `gtag.js` injection is gated by `analytics/consent.ts`:
 *   - No script is injected while unconsented (no choice, "necessary only",
 *     or a same-session dismissal — default-deny).
 *   - The script injects immediately when consent is already `'accepted'` at
 *     mount.
 *   - The script injects retroactively the moment consent becomes accepted
 *     after mount (the same-page "Accept All" case), without a remount.
 *   - An empty `trackingId` never injects, regardless of consent.
 *   - Repeated consent-change notifications never produce a duplicate script
 *     tag (the pre-existing `getElementById` guard makes injection attempts
 *     idempotent).
 *
 * Determinism (constitution III): a controlled `document.cookie` override
 * mirrors the pattern used in `CookieBanner.test.tsx`/`consent.test.ts`. No
 * real timers, no network — `GoogleTag` only ever appends a `<script>` tag,
 * it never itself makes a request in this test environment.
 */
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { render } from '@testing-library/react';

import { GoogleTag } from './GoogleTag';
import { setCookieConsent, dismissBannerForSession } from '../analytics/consent';

const SCRIPT_ID = 'google-tag-script';
const TRACKING_ID = 'G-TESTID123';

// ---------------------------------------------------------------------------
// Controlled document.cookie store — same pattern as consent.test.ts.
// ---------------------------------------------------------------------------
let cookieStore = new Map<string, string>();

beforeAll(() => {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () =>
      Array.from(cookieStore.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    set: (value: string) => {
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

function scriptTag(): HTMLScriptElement | null {
  return document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
}

beforeEach(() => {
  cookieStore = new Map();
  document.getElementById(SCRIPT_ID)?.remove();
});

describe('GoogleTag — consent gating (default-deny)', () => {
  it('does not inject the script when no consent choice has been made', () => {
    render(<GoogleTag trackingId={TRACKING_ID} />);
    expect(scriptTag()).toBeNull();
  });

  it('does not inject the script when the visitor chose necessary cookies only', () => {
    setCookieConsent('necessary');
    render(<GoogleTag trackingId={TRACKING_ID} />);
    expect(scriptTag()).toBeNull();
  });

  it('does not inject the script during a same-session dismissal (no persistent choice)', () => {
    dismissBannerForSession();
    render(<GoogleTag trackingId={TRACKING_ID} />);
    expect(scriptTag()).toBeNull();
  });

  it('never injects when trackingId is empty, even with consent accepted', () => {
    setCookieConsent('accepted');
    render(<GoogleTag trackingId="" />);
    expect(scriptTag()).toBeNull();
  });
});

describe('GoogleTag — injects when consent is accepted', () => {
  it('injects the script immediately when consent is already accepted at mount', () => {
    setCookieConsent('accepted');
    render(<GoogleTag trackingId={TRACKING_ID} />);

    const script = scriptTag();
    expect(script).not.toBeNull();
    expect(script?.src).toContain(TRACKING_ID);
    expect(typeof window.gtag).toBe('function');
  });

  it('injects the script retroactively the moment consent becomes accepted after mount', () => {
    render(<GoogleTag trackingId={TRACKING_ID} />);
    expect(scriptTag()).toBeNull();

    // Simulates a same-page "Accept All" click, which notifies subscribers
    // synchronously via analytics/consent.ts.
    setCookieConsent('accepted');

    expect(scriptTag()).not.toBeNull();
  });

  it('does not inject a duplicate script tag across repeated consent-change notifications', () => {
    render(<GoogleTag trackingId={TRACKING_ID} />);

    setCookieConsent('necessary');
    setCookieConsent('accepted');
    setCookieConsent('accepted');

    expect(document.querySelectorAll(`#${SCRIPT_ID}`)).toHaveLength(1);
  });
});
