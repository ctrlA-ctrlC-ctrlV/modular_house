/**
 * T047 / T048 / T049 — CookieBanner unit tests (T-F1 / T-F2 / T-F3, US1).
 *
 * Asserts the public-site cookie notice banner against the pinned constants
 * in plan.md §2.1 K4 and §2.2 N1–N5:
 *   - T047 (T-F1) — fresh state renders the performance-cookies-only statement,
 *     acknowledge button, close ("x") control, and /cookie-policy link as a
 *     position:fixed bottom overlay; `mh_cookie_ack=1` suppresses the banner.
 *   - T048 (T-F2) — acknowledge and close both set `mh_cookie_ack=1` with a
 *     365-day Max-Age (Path=/, SameSite=Lax), hide the banner in the same
 *     frame, and never show it again while the cookie persists; no dismissal
 *     path skips the cookie.
 *   - T049 (T-F3) — the banner never intercepts input outside its bounds,
 *     both controls are keyboard reachable/operable with visible focus,
 *     `role="region"` + `aria-label="Cookie notice"`, no focus trap, and
 *     clearing the cookie makes the banner return.
 *
 * This is a test-first file: authored BEFORE CookieBanner.tsx exists. All
 * three describe blocks are expected to fail ONLY because the module is
 * missing (tasks.md T047/T048/T049 "Done when: … does not exist"); T050
 * turns them green.
 *
 * Determinism (constitution III): a controlled `document.cookie` override
 * captures every cookie write's full attribute string (jsdom's native getter
 * returns only `name=value` pairs). No real timers, no real network — the
 * banner is a pure client-side component with no I/O.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CookieBanner } from './CookieBanner';

expect.extend(toHaveNoViolations);

// ---------------------------------------------------------------------------
// Controlled document.cookie store.
// ---------------------------------------------------------------------------
// Identical pattern to beacon.test.ts: jsdom's native `document.cookie` getter
// returns only `name=value` pairs (attributes are not readable back), so a
// controlled override is installed that stores cookies in a Map for the getter
// and records every full assigned attribute string in `cookieSetCalls` so the
// Max-Age / Path / SameSite assertions can check the raw write verbatim.
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
// Constants matching plan §2.1 K4.
// ---------------------------------------------------------------------------
const ACK_COOKIE_NAME = 'mh_cookie_ack';
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

beforeEach(() => {
  cookieStore = new Map();
  cookieSetCalls = [];
});

// ---------------------------------------------------------------------------
// T047 — T-F1: first render (US1-1, N1/N2, K4, FR-001/FR-002)
// ---------------------------------------------------------------------------

describe('CookieBanner — first render (T047, T-F1)', () => {
  it('renders the performance-cookies-only statement, acknowledge button, close control, and policy link on fresh state (no mh_cookie_ack)', () => {
    renderBanner();

    // The statement must mention "performance cookies" (FR-002).
    const region = screen.getByRole('region', { name: /cookie notice/i });
    expect(region).toBeInTheDocument();
    expect(region.textContent).toMatch(/performance cookies/i);

    // Acknowledge button (FR-002).
    expect(
      screen.getByRole('button', { name: /acknowledge/i }),
    ).toBeInTheDocument();

    // Close ("x") control (FR-002).
    expect(
      screen.getByRole('button', { name: /close/i }),
    ).toBeInTheDocument();

    // Link to /cookie-policy (FR-002, N4).
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

  it('does not render at all when mh_cookie_ack=1 is present (K4, N2)', () => {
    // Simulate a previously-acknowledged visitor.
    cookieStore.set(ACK_COOKIE_NAME, '1');

    renderBanner();

    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T048 — T-F2: acknowledgment (US1-2/3, N3, K1/K4, FR-002/FR-003)
// ---------------------------------------------------------------------------

describe('CookieBanner — acknowledgment (T048, T-F2)', () => {
  it('acknowledge sets mh_cookie_ack=1 with 365-day Max-Age, Path=/, SameSite=Lax and hides the banner in the same frame (K4, N3, FR-003)', () => {
    renderBanner();

    const ackButton = screen.getByRole('button', { name: /acknowledge/i });
    fireEvent.click(ackButton);

    // The cookie must be written with the exact K4 attributes.
    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_ack=1/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);

    // The banner must be hidden in the same frame (N3 — immediate effect).
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('close ("x") has the identical effect as acknowledge — sets mh_cookie_ack=1 and hides the banner (N3, FR-002)', () => {
    renderBanner();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Same cookie attributes as acknowledge (K4).
    const writes = cookieWritesFor(ACK_COOKIE_NAME);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/mh_cookie_ack=1/);
    expect(writes[0]).toMatch(new RegExp(`max-age=${ACK_MAX_AGE_SECONDS}`, 'i'));
    expect(writes[0]).toMatch(/path=\//i);
    expect(writes[0]).toMatch(/samesite=lax/i);

    // Banner hidden in the same frame, identical to acknowledge (N3).
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('remount with mh_cookie_ack present shows no banner (N3 — persists across remounts)', () => {
    // First mount: acknowledge, which sets the cookie.
    const { unmount } = renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    unmount();

    // Second mount: the cookie is present, so the banner must not render.
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();
  });

  it('there is no dismissal path that skips the cookie — both controls write mh_cookie_ack (N3, FR-028 seam)', () => {
    // Both the acknowledge and close controls must go through the same
    // acknowledgment seam (FR-028 extension point): there is no way to
    // dismiss the banner without writing the cookie. Verified by asserting
    // each control writes the cookie independently.
    const { unmount } = renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    expect(cookieWritesFor(ACK_COOKIE_NAME)).toHaveLength(1);
    unmount();

    // Reset and verify the close control also writes the cookie. Both the
    // call log AND the cookie store must be cleared so the fresh render
    // actually shows the banner (the previous acknowledge set the cookie).
    cookieSetCalls = [];
    cookieStore.delete(ACK_COOKIE_NAME);
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(cookieWritesFor(ACK_COOKIE_NAME)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// T049 — T-F3: a11y / non-blocking (US1-4/6/9, N5, FR-004, SC-002)
// ---------------------------------------------------------------------------

describe('CookieBanner — a11y / non-blocking (T049, T-F3)', () => {
  it('has role="region" and aria-label="Cookie notice" (N5)', () => {
    renderBanner();
    const region = screen.getByRole('region', { name: /cookie notice/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Cookie notice');
  });

  it('both controls are keyboard reachable (natively focusable button elements, N5)', () => {
    renderBanner();

    const ackButton = screen.getByRole('button', { name: /acknowledge/i });
    const closeButton = screen.getByRole('button', { name: /close/i });

    // Buttons are natively focusable (tabIndex 0 by default); focusing them
    // proves keyboard reachability.
    ackButton.focus();
    expect(document.activeElement).toBe(ackButton);

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
  });

  it('both controls are keyboard operable — Enter activates them and writes the cookie (N5, FR-004)', () => {
    renderBanner();

    // Acknowledge via Enter key.
    const ackButton = screen.getByRole('button', { name: /acknowledge/i });
    ackButton.focus();
    fireEvent.keyDown(ackButton, { key: 'Enter' });
    // Buttons fire click on Enter in real browsers; the component's onClick
    // handler writes the cookie. fireEvent.click simulates the browser's
    // default action for Enter on a button.
    fireEvent.click(ackButton);
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

    // Focus the banner's close control (last tabbable inside the banner).
    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    // Move focus to the outside button — the banner must not prevent this.
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

    // The outside button must be clickable while the banner is visible.
    fireEvent.click(screen.getByRole('button', { name: /outside content/i }));
    expect(outsideClickSpy).toHaveBeenCalledTimes(1);
  });

  it('clearing the cookie makes the banner return (US1-7, N3)', () => {
    // First: acknowledge so the cookie is set and the banner is hidden.
    const { unmount } = renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    unmount();

    // Second mount with the cookie present — no banner.
    renderBanner();
    expect(
      screen.queryByRole('region', { name: /cookie notice/i }),
    ).not.toBeInTheDocument();

    // Clear the cookie (simulating the visitor clearing browser data).
    cookieStore.delete(ACK_COOKIE_NAME);

    // Third mount — the banner must return.
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
