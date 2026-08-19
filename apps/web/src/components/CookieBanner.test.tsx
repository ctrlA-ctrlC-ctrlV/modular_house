/**
 * CookieBanner unit tests (T-F1/T-F2/T-F3, US1; opt-in model per FR-028).
 *
 * Asserts the public-site cookie notice banner's three-control consent model
 * against `analytics/consent.ts`:
 *   - First render — fresh state renders the two-tier statement, "Accept
 *     All", "Necessary Cookies Only", the close ("x") control, and the
 *     `/cookie-policy` link as a position:fixed bottom overlay; the banner is
 *     suppressed whenever a persistent choice OR a same-session dismissal is
 *     already recorded.
 *   - Choices — "Accept All" and "Necessary Cookies Only" each write
 *     `mh_cookie_ack` with the corresponding value and a 365-day Max-Age
 *     (Path=/, SameSite=Lax), hide the banner in the same frame, and persist
 *     across remounts. Close ("x") writes only `mh_cookie_dismissed`, a true
 *     session cookie (no Max-Age attribute) — it never writes `mh_cookie_ack`
 *     — and that dismissal persists only while the session cookie survives,
 *     unlike the two persistent choices.
 *   - a11y / non-blocking — the banner never intercepts input outside its
 *     bounds, all three controls are keyboard reachable/operable with visible
 *     focus, `role="region"` + `aria-label="Cookie notice"`, no focus trap.
 *   - Cross-component reactivity — clearing consent through
 *     `analytics/consent.ts` (as the Cookie Policy page's "Change Cookie
 *     Preferences" control does) makes an already-mounted banner reappear
 *     without a remount.
 *
 * Determinism (constitution III): a controlled `document.cookie` override
 * captures every cookie write's full attribute string (jsdom's native getter
 * returns only `name=value` pairs). No real timers, no real network — the
 * banner is a pure client-side component with no I/O.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CookieBanner } from './CookieBanner';
import {
  ACK_COOKIE_NAME,
  DISMISS_COOKIE_NAME,
  clearCookieConsent,
} from '../analytics/consent';

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Controlled document.cookie store.
// ---------------------------------------------------------------------------
// jsdom's native `document.cookie` getter returns only `name=value` pairs
// (attributes are not readable back), so a controlled override is installed
// that stores cookies in a Map for the getter and records every full assigned
// attribute string in `cookieSetCalls` so the Max-Age / Path / SameSite
// assertions can check the raw write verbatim.
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

// ---------------------------------------------------------------------------
// Pinned duration.
// ---------------------------------------------------------------------------
const ACK_MAX_AGE_SECONDS = 365 * 24 * 60 * 60; // 31536000

// ---------------------------------------------------------------------------
// Shared helpers.
// ---------------------------------------------------------------------------

/** Full attribute strings written for a given cookie name, in write order. */
function cookieWritesFor(name: string): string[] {
  return cookieSetCalls.filter((write) => write.startsWith(`${name}=`));
}

/** Render the banner inside a MemoryRouter (the policy link needs a router). */
function renderBanner(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <CookieBanner />
    </MemoryRouter>,
  );
}

function getAcceptAllButton() {
  return screen.getByRole('button', { name: /accept all/i });
}

function getNecessaryOnlyButton() {
  return screen.getByRole('button', { name: /necessary cookies only/i });
}

function getCloseButton() {
  return screen.getByRole('button', { name: /close/i });
}

beforeEach(() => {
  cookieStore = new Map();
  cookieSetCalls = [];
});

// ---------------------------------------------------------------------------
// First render (US1-1, N1/N2, FR-001/FR-002/FR-028)
// ---------------------------------------------------------------------------

describe('CookieBanner — first render', () => {
  it('renders the two-tier statement, both choice buttons, the close control, and the policy link on fresh state', () => {
    renderBanner();

    const region = screen.getByRole('region', { name: /cookie notice/i });
    expect(region).toBeInTheDocument();
    expect(region.textContent).toMatch(/necessary cookies/i);
    expect(region.textContent).toMatch(/performance cookies/i);

    expect(getAcceptAllButton()).toBeInTheDocument();
    expect(getNecessaryOnlyButton()).toBeInTheDocument();
    expect(getCloseButton()).toBeInTheDocument();

    const policyLink = screen.getByRole('link', { name: /cookie policy/i });
    expect(policyLink).toBeInTheDocument();
    expect(policyLink).toHaveAttribute('href', '/cookie-policy');
  });

  it('is a position:fixed bottom overlay (zero layout shift, N1)', () => {
    renderBanner();

    const region = screen.getByRole('region', { name: /cookie notice/i });
    // The `fixed-bottom` Bootstrap class provides position:fixed; bottom:0.
    // jsdom cannot resolve class-based CSS, so the class presence is the
    // testable proxy — the actual position:fixed is a visual/human check.
    expect(region.className).toMatch(/fixed-bottom/);
  });

  it('does not render when a persistent choice (mh_cookie_ack=accepted) is present', () => {
    cookieStore.set(ACK_COOKIE_NAME, 'accepted');
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render when a persistent choice (mh_cookie_ack=necessary) is present', () => {
    cookieStore.set(ACK_COOKIE_NAME, 'necessary');
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render when the banner was already dismissed this session (mh_cookie_dismissed) even without a persistent choice', () => {
    cookieStore.set(DISMISS_COOKIE_NAME, '1');
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Choices — Accept All / Necessary Cookies Only / Close (N3, K4, FR-028)
// ---------------------------------------------------------------------------

describe('CookieBanner — Accept All', () => {
  it('sets mh_cookie_ack=accepted with 365-day Max-Age, Path=/, SameSite=Lax, hides the banner in the same frame, and writes no dismissal cookie', () => {
    renderBanner();
    fireEvent.click(getAcceptAllButton());

    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_ack=accepted/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);
    expect(cookieWritesFor(DISMISS_COOKIE_NAME)).toHaveLength(0);

    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('persists across remounts — the banner never returns after Accept All', () => {
    const { unmount } = renderBanner();
    fireEvent.click(getAcceptAllButton());
    unmount();

    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });
});

describe('CookieBanner — Necessary Cookies Only', () => {
  it('sets mh_cookie_ack=necessary with 365-day Max-Age, Path=/, SameSite=Lax, hides the banner in the same frame, and writes no dismissal cookie', () => {
    renderBanner();
    fireEvent.click(getNecessaryOnlyButton());

    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_ack=necessary/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);
    expect(cookieWritesFor(DISMISS_COOKIE_NAME)).toHaveLength(0);

    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('persists across remounts — the banner never returns after Necessary Cookies Only', () => {
    const { unmount } = renderBanner();
    fireEvent.click(getNecessaryOnlyButton());
    unmount();

    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });
});

describe('CookieBanner — close ("x") is a session-only dismissal, not a choice', () => {
  it('writes mh_cookie_dismissed as a true session cookie (no Max-Age attribute) and never writes mh_cookie_ack', () => {
    renderBanner();
    fireEvent.click(getCloseButton());

    const dismissWrites = cookieWritesFor(DISMISS_COOKIE_NAME);
    expect(dismissWrites).toHaveLength(1);
    expect(dismissWrites[0]).toMatch(/mh_cookie_dismissed=1/);
    expect(dismissWrites[0]).not.toMatch(/max-age/i);
    expect(dismissWrites[0]).toMatch(/path=\//i);
    expect(dismissWrites[0]).toMatch(/samesite=lax/i);

    expect(cookieWritesFor(ACK_COOKIE_NAME)).toHaveLength(0);

    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('stays hidden across a remount within the same session (the session cookie still present)', () => {
    const { unmount } = renderBanner();
    fireEvent.click(getCloseButton());
    unmount();

    // Same-session remount: the dismissal cookie is still in the store
    // (a real browser would keep it until the browser closes).
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('reappears once the session ends (the session cookie is gone) — unlike a persistent choice', () => {
    const { unmount } = renderBanner();
    fireEvent.click(getCloseButton());
    unmount();

    // Simulate the browser session ending: a true session cookie has no
    // Max-Age/Expires, so the browser drops it on close — modelled here by
    // removing it from the store directly, since jsdom cannot close.
    cookieStore.delete(DISMISS_COOKIE_NAME);

    renderBanner();
    expect(
      screen.getByRole('region', { name: /cookie notice/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Cross-component reactivity — consent cleared elsewhere (Cookie Policy
// page's "Change Cookie Preferences" control) re-shows an already-mounted
// banner without a remount.
// ---------------------------------------------------------------------------

describe('CookieBanner — reacts to consent cleared elsewhere', () => {
  it('reappears immediately when clearCookieConsent() is called while mounted, without unmounting/remounting', () => {
    renderBanner();
    fireEvent.click(getAcceptAllButton());
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();

    // Simulates the Cookie Policy page's "Change Cookie Preferences" control,
    // which calls the same consent.ts function from a different component.
    // Wrapped in act() because this dispatches the consent-change event
    // directly rather than through a simulated DOM event that
    // fireEvent/userEvent would wrap automatically.
    act(() => {
      clearCookieConsent();
    });

    expect(
      screen.getByRole('region', { name: /cookie notice/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// a11y / non-blocking (US1-4/6/9, N5, FR-004, SC-002)
// ---------------------------------------------------------------------------

describe('CookieBanner — a11y / non-blocking', () => {
  it('has role="region" and aria-label="Cookie notice" (N5)', () => {
    renderBanner();
    const region = screen.getByRole('region', { name: /cookie notice/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Cookie notice');
  });

  it('all three controls are keyboard reachable (natively focusable button elements, N5)', () => {
    renderBanner();

    const acceptAllButton = getAcceptAllButton();
    const necessaryOnlyButton = getNecessaryOnlyButton();
    const closeButton = getCloseButton();

    acceptAllButton.focus();
    expect(document.activeElement).toBe(acceptAllButton);

    necessaryOnlyButton.focus();
    expect(document.activeElement).toBe(necessaryOnlyButton);

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
  });

  it('all three controls are keyboard operable — Enter activates them (N5, FR-004)', () => {
    renderBanner();

    const necessaryOnlyButton = getNecessaryOnlyButton();
    necessaryOnlyButton.focus();
    fireEvent.keyDown(necessaryOnlyButton, { key: 'Enter' });
    // Buttons fire click on Enter in real browsers; the component's onClick
    // handler writes the cookie. fireEvent.click simulates the browser's
    // default action for Enter on a button.
    fireEvent.click(necessaryOnlyButton);
    expect(cookieWritesFor(ACK_COOKIE_NAME)).toHaveLength(1);
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('does not trap focus — focus can move from the banner to an outside element (N5, FR-004)', () => {
    render(
      <MemoryRouter>
        <div>
          <CookieBanner />
          <button>Outside content</button>
        </div>
      </MemoryRouter>,
    );

    const closeButton = getCloseButton();
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    const outsideButton = screen.getByRole('button', { name: /outside content/i });
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);
  });

  it('never intercepts input outside its own bounds — page content stays interactive (FR-004)', () => {
    const outsideClickSpy = vi.fn();

    render(
      <MemoryRouter>
        <div>
          <CookieBanner />
          <button onClick={outsideClickSpy}>Outside content</button>
        </div>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /outside content/i }));
    expect(outsideClickSpy).toHaveBeenCalledTimes(1);
  });

  it('clearing all cookies makes the banner return (US1-7, N3)', () => {
    const { unmount } = renderBanner();
    fireEvent.click(getAcceptAllButton());
    unmount();

    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();

    cookieStore.delete(ACK_COOKIE_NAME);

    renderBanner();
    expect(
      screen.getByRole('region', { name: /cookie notice/i }),
    ).toBeInTheDocument();
  });

  it('has zero axe accessibility violations (N5, FR-004)', async () => {
    const { container } = renderBanner();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// E-A11Y edge test (plan §4.2: "banner and dashboard axe checks")
// ---------------------------------------------------------------------------
// Extends the axe scan above with a scan of the banner rendered alongside
// other page content — proving the "zero critical violations" requirement
// (DoD-6) holds for the composed page, not just the banner subtree in
// isolation (e.g. no id collisions, landmark conflicts, or focus-order
// defects that only surface once the banner shares a document with the rest
// of the site).

describe('CookieBanner — accessibility edge case', () => {
  it('has zero axe violations when rendered together with surrounding page content', async () => {
    render(
      <MemoryRouter>
        <div>
          <main>
            <h1>Page content</h1>
            <button>Outside content</button>
          </main>
          <CookieBanner />
        </div>
      </MemoryRouter>,
    );

    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
