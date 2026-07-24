/**
 * T045 — Beacon unit tests (T-F5, US2-1).
 *
 * Asserts the happy-path behaviour of the public page-view beacon module
 * (`beacon.ts`) against the pinned constants in plan.md §2:
 *   - K1/K2/K3 — `mh_vid` (UUID v4, 365-day rolling Max-Age, renewed same value
 *     per measured view) and `mh_sid` (UUID v4, 30-minute rolling Max-Age,
 *     renewed same value per measured view); both `Path=/`, `SameSite=Lax`.
 *   - M8/R1 — exactly one event per page view (initial load + each SPA pathname
 *     change; same-path navigation sends nothing); `navigator.sendBeacon` is the
 *     transport with `fetch(keepalive: true)` fallback only when sendBeacon is
 *     unavailable; 0 retries; all failures swallowed (page never errors).
 *   - M5/FR-014 — `/admin` and `/admin/*` never send (and never set cookies).
 *   - M2/FR-015 — `adClick: true` is sent when the landing URL carries a known
 *     ad click-ID parameter (`gclid`/`fbclid`); the click-ID VALUE itself never
 *     appears in any payload.
 *   - M2/R3 — `document.referrer` is forwarded as `referrer` and
 *     `utm_source`/`utm_medium`/`utm_campaign` are forwarded as
 *     `utmSource`/`utmMedium`/`utmCampaign` when present; all optional fields
 *     are omitted when their source value is absent/empty.
 *
 * Determinism (constitution III): fake timers (Date only) provide a fixed
 * deterministic epoch; `crypto.randomUUID` is wrapped so renewal assertions can
 * distinguish "reused the existing cookie value" from "regenerated". No real
 * network call leaves the test process — `navigator.sendBeacon` and `fetch` are
 * mocked at the module boundary (research R1).
 *
 * This is a test-first file: it is authored BEFORE `beacon.ts` exists and is
 * expected to fail ONLY because the module is missing (plan §4.3 ADD, tasks.md
 * T045 "Done when: suite fails only because beacon.ts does not exist").
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted mutable router location mock for the useBeacon hook.
// ---------------------------------------------------------------------------
// `vi.mock` factories are hoisted above every import, so the mutable location
// object must be created with `vi.hoisted` to exist before the factory runs.
// The useBeacon hook reads `useLocation()` from react-router-dom; the mock
// returns this object, and tests mutate `pathname`/`search` then `rerender()`
// to simulate SPA navigation without needing a Router wrapper (no JSX required
// in this .ts file).
const { mockLocation } = vi.hoisted(() => ({
  mockLocation: { pathname: '/', search: '' } as { pathname: string; search: string },
}));

// Replace react-router-dom with a thin mock that only exposes `useLocation`.
// The beacon module imports nothing else from react-router-dom, so a partial
// mock is sufficient and avoids pulling in the real router runtime.
vi.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
}));

// The beacon module is imported AFTER the react-router-dom mock so its
// `useLocation` binding resolves to the mocked function. The module does not
// exist yet at T045 authoring time — the suite is red for that missing module.
import {
  sendPageView,
  useBeacon,
  detectAdClick,
  AD_CLICK_PARAMS,
  VISITOR_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from './beacon';

// ---------------------------------------------------------------------------
// Fixed deterministic epoch (constitution III — no real Date.now()).
// ---------------------------------------------------------------------------
const FIXED_NOW = new Date('2026-07-22T12:00:00Z').getTime();

// ---------------------------------------------------------------------------
// Controlled document.cookie store.
// ---------------------------------------------------------------------------
// jsdom's native `document.cookie` getter returns only `name=value` pairs
// (attributes are not readable back), which would make asserting `max-age`,
// `path`, and `samesite` impossible. This override installs an own accessor on
// `document` that stores cookies in a Map for the getter (matching jsdom's
// `name=value; name=value` join format) and records every full assigned
// attribute string in `cookieSetCalls` so tests can assert cookie attributes
// verbatim. The closures reference the module-scoped `let` bindings, so
// reassigning the Maps/arrays in `beforeEach` resets the visible state without
// redefining the property.
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
      // Honour `max-age=0` (or negative) as a deletion so any cleanup write
      // removes the cookie, matching real browser semantics.
      if (maxAgeAttr && Number(maxAgeAttr.split('=')[1]) <= 0) {
        cookieStore.delete(name);
      } else {
        cookieStore.set(name, rawValue);
      }
    },
  });
});

// ---------------------------------------------------------------------------
// Controlled crypto.randomUUID.
// ---------------------------------------------------------------------------
// Captured BEFORE the mock is installed so the default implementation can call
// through to the real UUID v4 generator (used by the format assertions). Tests
// that need deterministic values queue `mockReturnValueOnce` values; once the
// queue is exhausted the spy falls back to this real implementation, so an
// accidental regeneration would produce a DIFFERENT value and fail the renewal
// assertions rather than silently passing.
const realRandomUUID: () => string = crypto.randomUUID.bind(crypto);
const uuidSpy = vi.fn(() => realRandomUUID());

beforeAll(() => {
  Object.defineProperty(crypto, 'randomUUID', {
    value: uuidSpy,
    configurable: true,
    writable: true,
  });
});

// ---------------------------------------------------------------------------
// Controlled document.referrer.
// ---------------------------------------------------------------------------
// jsdom's `document.referrer` is a read-only property defaulting to `''`. A
// configurable getter override lets individual tests set a non-empty referrer
// to verify the beacon forwards it (M2, research R3). The module-level
// `documentReferrer` is reset to `''` in `beforeEach` so tests start clean.
let documentReferrer = '';

beforeAll(() => {
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    get: () => documentReferrer,
  });
});

// ---------------------------------------------------------------------------
// Transport mocks — sendBeacon + fetch.
// ---------------------------------------------------------------------------
// `navigator.sendBeacon` is undefined in jsdom, so it is defined here as a mock.
// `fetch` is stubbed globally; the default is a resolved 204-like response. The
// `keepalive` flag on the fetch init is the seam asserted by the fallback tests.
//
// jsdom's `Blob` does not implement `.text()`, so a minimal stand-in is stubbed
// globally for this file: it stores the constructor parts and exposes `.text()`
// / `.type` so the payload-extraction helper can read the serialised sendBeacon
// body back. The implementation only constructs `new Blob([body], { type })`,
// which this stand-in satisfies. `parts` is typed `unknown[]` (rather than the
// DOM `BlobPart[]`) so ESLint's `no-undef` — which does not know TypeScript DOM
// type aliases — does not flag it.
class MockBlob {
  readonly type: string;

  private readonly parts: unknown[];

  constructor(parts: unknown[], options?: { type?: string }) {
    this.parts = parts;
    this.type = options?.type ?? '';
  }

  async text(): Promise<string> {
    return this.parts
      .map((part) => (typeof part === 'string' ? part : String(part)))
      .join('');
  }
}

/**
 * Shape of the fetch init the beacon passes to the keepalive fallback. A local
 * interface (rather than the DOM `RequestInit`) keeps ESLint's `no-undef` happy
 * while still typing the fields the assertions read (`method`, `body`,
 * `keepalive`).
 */
interface FetchInit {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  keepalive?: boolean;
}

// The mocks are typed with explicit parameter signatures so `mock.calls` is a
// `Parameters<T>[]` array with the right tuple shape — letting the assertions
// destructure `calls[0]` into `[url, blob]` / `[url, init]` without non-null
// assertions or `as` casts.
const sendBeaconMock = vi.fn<(url: string, data: Blob) => boolean>();
const fetchMock = vi.fn<(url: string, init?: FetchInit) => Promise<Response>>();

beforeAll(() => {
  Object.defineProperty(navigator, 'sendBeacon', {
    value: sendBeaconMock,
    configurable: true,
    writable: true,
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Blob', MockBlob);
});

// ---------------------------------------------------------------------------
// Shared reset hooks.
// ---------------------------------------------------------------------------
// Every test starts from a clean cookie store, fresh call histories, a restored
// sendBeacon that reports success, a real-randomUUID default, a silenced
// console.error, and a fixed system clock (Date only — setTimeout/setInterval
// stay real so React effect flushing inside `act` is unaffected).
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  cookieStore = new Map();
  cookieSetCalls = [];
  mockLocation.pathname = '/';
  mockLocation.search = '';
  documentReferrer = '';

  uuidSpy.mockReset();
  uuidSpy.mockImplementation(() => realRandomUUID());

  // Re-install sendBeacon every run: tests that need it unavailable assign
  // `undefined` to `navigator.sendBeacon`, and without this restore the
  // absence would leak into every later test in the file.
  Object.defineProperty(navigator, 'sendBeacon', {
    value: sendBeaconMock,
    configurable: true,
    writable: true,
  });
  sendBeaconMock.mockReset();
  sendBeaconMock.mockReturnValue(true);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 204 } as Response);

  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Test helpers.
// ---------------------------------------------------------------------------

/** UUID v4 format matcher (version digit 4, variant 8/9/a/b). */
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Full attribute strings written for a given cookie name, in write order. */
function cookieWritesFor(name: string): string[] {
  return cookieSetCalls.filter((write) => write.startsWith(`${name}=`));
}

/** Extract the `value` portion from a `name=value; ...` cookie write string. */
function cookieValue(write: string): string {
  const pair = write.split(';')[0] ?? '';
  return pair.slice(pair.indexOf('=') + 1);
}

/**
 * Parse the payload of the most recent beacon dispatch. Reads the Blob body
 * when sendBeacon was the transport, or the fetch `body` string when the
 * keepalive fallback fired. Throws if no dispatch was recorded.
 */
async function lastPayload(): Promise<Record<string, unknown>> {
  const beaconCall = sendBeaconMock.mock.calls.at(-1);
  if (beaconCall) {
    const blob = beaconCall[1];
    return JSON.parse(await blob.text()) as Record<string, unknown>;
  }
  const fetchCall = fetchMock.mock.calls.at(-1);
  if (fetchCall) {
    const body = fetchCall[1]?.body;
    return JSON.parse(
      typeof body === 'string' ? body : String(body),
    ) as Record<string, unknown>;
  }
  throw new Error('no beacon dispatch recorded');
}

/** Flush queued microtasks so an unhandled/swallowed rejection settles. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// 1. Exported constants — extensible ad click-ID list + cookie names.
// ---------------------------------------------------------------------------

describe('AD_CLICK_PARAMS and cookie-name exports', () => {
  it('exports the extensible ad click-ID parameter list gclid, fbclid (M2)', () => {
    expect(AD_CLICK_PARAMS).toEqual(['gclid', 'fbclid']);
  });

  it('exports the Phase 2 cookie names for the register-consistency test (K1)', () => {
    expect(VISITOR_COOKIE_NAME).toBe('mh_vid');
    expect(SESSION_COOKIE_NAME).toBe('mh_sid');
  });
});

// ---------------------------------------------------------------------------
// 2. Cookie set/renew — K1/K2/K3.
// ---------------------------------------------------------------------------

describe('sendPageView — cookie set/renew (K1/K2/K3)', () => {
  it('sets mh_vid as a UUID v4 with a 365-day Max-Age, Path=/, SameSite=Lax on first view (K1/K2)', () => {
    sendPageView({ pathname: '/garden-rooms' });

    const vidWrites = cookieWritesFor('mh_vid');
    expect(vidWrites).toHaveLength(1);
    expect(cookieValue(vidWrites[0])).toMatch(UUID_V4);
    expect(vidWrites[0]).toMatch(/max-age=31536000/i); // 365 days in seconds
    expect(vidWrites[0]).toMatch(/path=\//i);
    expect(vidWrites[0]).toMatch(/samesite=lax/i);
  });

  it('sets mh_sid as a UUID v4 with a 30-minute Max-Age, Path=/, SameSite=Lax on first view (K1/K3)', () => {
    sendPageView({ pathname: '/garden-rooms' });

    const sidWrites = cookieWritesFor('mh_sid');
    expect(sidWrites).toHaveLength(1);
    expect(cookieValue(sidWrites[0])).toMatch(UUID_V4);
    expect(sidWrites[0]).toMatch(/max-age=1800/i); // 30 minutes in seconds
    expect(sidWrites[0]).toMatch(/path=\//i);
    expect(sidWrites[0]).toMatch(/samesite=lax/i);
  });

  it('renews mh_vid with the SAME value and a fresh 365-day Max-Age on every measured view; no regeneration (K2)', () => {
    const visitorUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const sessionUuid = 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb';
    // First view mints both ids; subsequent views must reuse the stored values.
    uuidSpy
      .mockReturnValueOnce(visitorUuid)
      .mockReturnValueOnce(sessionUuid);

    sendPageView({ pathname: '/' });
    const firstVid = cookieValue(cookieWritesFor('mh_vid')[0]);

    sendPageView({ pathname: '/about' });
    const vidWrites = cookieWritesFor('mh_vid');

    expect(vidWrites).toHaveLength(2);
    expect(cookieValue(vidWrites[1])).toBe(firstVid); // same value, fresh expiry
    expect(vidWrites[1]).toMatch(/max-age=31536000/i);
    // randomUUID was called exactly twice (vid + sid on view 1 only).
    expect(uuidSpy).toHaveBeenCalledTimes(2);
  });

  it('renews mh_sid with the SAME value and a fresh 30-minute Max-Age on every measured view; no regeneration (K3)', () => {
    const visitorUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const sessionUuid = 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb';
    uuidSpy
      .mockReturnValueOnce(visitorUuid)
      .mockReturnValueOnce(sessionUuid);

    sendPageView({ pathname: '/' });
    const firstSid = cookieValue(cookieWritesFor('mh_sid')[0]);

    sendPageView({ pathname: '/contact' });
    const sidWrites = cookieWritesFor('mh_sid');

    expect(sidWrites).toHaveLength(2);
    expect(cookieValue(sidWrites[1])).toBe(firstSid); // same value, fresh expiry
    expect(sidWrites[1]).toMatch(/max-age=1800/i);
    expect(uuidSpy).toHaveBeenCalledTimes(2);
  });

  it('issues a fresh mh_vid value when the cookie is absent on a later view (K2 re-issue)', () => {
    const visitorUuid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const sessionUuid = 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb';
    uuidSpy
      .mockReturnValueOnce(visitorUuid)
      .mockReturnValueOnce(sessionUuid);

    sendPageView({ pathname: '/' });
    expect(cookieValue(cookieWritesFor('mh_vid')[0])).toBe(visitorUuid);

    // Simulate the cookie being cleared/blocked between views: drop it from the
    // store so the next view cannot read it back.
    cookieStore.delete('mh_vid');
    // Queue a distinct visitor id for the re-issue; sid is still present.
    const newVisitorUuid = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    uuidSpy.mockReturnValueOnce(newVisitorUuid);

    sendPageView({ pathname: '/about' });
    const vidWrites = cookieWritesFor('mh_vid');
    expect(cookieValue(vidWrites[1])).toBe(newVisitorUuid);
    expect(newVisitorUuid).toMatch(UUID_V4);
  });
});

// ---------------------------------------------------------------------------
// 3. Transport selection — sendBeacon primary, keepalive fetch fallback (M8, R1).
// ---------------------------------------------------------------------------

describe('sendPageView — transport selection (M8, R1)', () => {
  it('uses navigator.sendBeacon as the transport and does not call fetch when sendBeacon is available', async () => {
    sendPageView({ pathname: '/garden-rooms' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();

    const [url, blob] = sendBeaconMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/analytics/events');
    expect(blob.type).toBe('application/json');
    expect(await lastPayload()).toEqual({ path: '/garden-rooms' });
  });

  it('falls back to fetch with keepalive: true when sendBeacon is unavailable (R1)', async () => {
    // Simulate a browser without sendBeacon (e.g. an older Safari).
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;

    sendPageView({ pathname: '/garden-rooms' });

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/analytics/events');
    expect(init?.method).toBe('POST');
    expect(init?.keepalive).toBe(true);
    expect(init?.body).toBe(JSON.stringify({ path: '/garden-rooms' }));
  });
});

// ---------------------------------------------------------------------------
// 4. Silent failure handling — all failures swallowed (M8, FR-012, SC-009).
// ---------------------------------------------------------------------------

describe('sendPageView — silent failure handling (M8, FR-012)', () => {
  it('swallows a throwing sendBeacon and does not surface a console error (failures silent)', () => {
    sendBeaconMock.mockImplementation(() => {
      throw new Error('sendBeacon synchronous failure');
    });

    expect(() => sendPageView({ pathname: '/garden-rooms' })).not.toThrow();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('swallows a rejecting keepalive fetch and does not surface a console error (failures silent)', async () => {
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;
    fetchMock.mockRejectedValue(new Error('network down'));

    expect(() => sendPageView({ pathname: '/garden-rooms' })).not.toThrow();
    await flushMicrotasks();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. Admin path skip — M5, FR-014.
// ---------------------------------------------------------------------------

describe('sendPageView — admin path skip (M5, FR-014)', () => {
  it('never sends and never sets cookies for /admin', () => {
    sendPageView({ pathname: '/admin' });

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieWritesFor('mh_vid')).toHaveLength(0);
    expect(cookieWritesFor('mh_sid')).toHaveLength(0);
  });

  it('never sends for /admin/* paths', () => {
    sendPageView({ pathname: '/admin/analytics' });
    sendPageView({ pathname: '/admin/settings/profile' });

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still sends for a public path that merely starts with the token "admin" (M5 boundary)', async () => {
    // /administration is a public page, not an admin route (plan §2.3 M5).
    sendPageView({ pathname: '/administration' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(await lastPayload()).toEqual({ path: '/administration' });
  });
});

// ---------------------------------------------------------------------------
// 6. adClick detection + click-ID value absence (M2, FR-015).
// ---------------------------------------------------------------------------

describe('sendPageView — adClick detection (M2, FR-015)', () => {
  it('sends adClick: true when the landing URL carries gclid', async () => {
    sendPageView({ pathname: '/landing', search: '?gclid=Cj0KCQjwabc123-XYZ' });

    const payload = await lastPayload();
    expect(payload).toEqual({ path: '/landing', adClick: true });
  });

  it('sends adClick: true when the landing URL carries fbclid', async () => {
    sendPageView({ pathname: '/landing', search: '?fbclid=IwAR0xyz789' });

    const payload = await lastPayload();
    expect(payload).toEqual({ path: '/landing', adClick: true });
  });

  it('omits adClick when no ad click-ID parameter is present', async () => {
    // Use a non-UTM param so the assertion isolates the adClick omission from
    // the UTM-forwarding behaviour tested in the referrer/UTM describe block.
    sendPageView({ pathname: '/landing', search: '?foo=bar' });

    expect(await lastPayload()).toEqual({ path: '/landing' });
  });

  it('never transmits the click-ID value in any payload (FR-015)', async () => {
    const clickIdValue = 'Cj0KCQjwSUPER_SECRET_click_id_VALUE';
    sendPageView({ pathname: '/landing', search: `?gclid=${clickIdValue}` });

    // The payload must carry only the boolean flag — the secret value must not
    // appear anywhere in the serialized beacon body.
    const blob = sendBeaconMock.mock.calls[0][1];
    const serialized = await blob.text();
    expect(serialized).not.toContain(clickIdValue);
    expect(JSON.parse(serialized)).toEqual({ path: '/landing', adClick: true });
  });

  it('detectAdClick reads the extensible AD_CLICK_PARAMS list (M2)', () => {
    expect(detectAdClick('?gclid=abc')).toBe(true);
    expect(detectAdClick('?fbclid=abc')).toBe(true);
    expect(detectAdClick('?foo=bar')).toBe(false);
    expect(detectAdClick('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. Referrer + UTM forwarding — M2, research R3 (T046 review fix).
// ---------------------------------------------------------------------------

describe('sendPageView — referrer + UTM forwarding (M2, research R3)', () => {
  it('forwards document.referrer as referrer in the payload when non-empty (M2, R3, S5)', async () => {
    documentReferrer = 'https://www.google.com/search?q=garden+rooms';
    sendPageView({ pathname: '/garden-rooms' });

    const payload = await lastPayload();
    expect(payload).toEqual({
      path: '/garden-rooms',
      referrer: 'https://www.google.com/search?q=garden+rooms',
    });
  });

  it('omits referrer when document.referrer is empty (M2 optional field)', async () => {
    // documentReferrer is reset to '' in beforeEach.
    sendPageView({ pathname: '/garden-rooms' });

    const payload = await lastPayload();
    expect(payload).toEqual({ path: '/garden-rooms' });
    expect(payload).not.toHaveProperty('referrer');
  });

  it('forwards utm_source/utm_medium/utm_campaign from the URL search params (M2, R3)', async () => {
    sendPageView({
      pathname: '/landing',
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale',
    });

    const payload = await lastPayload();
    expect(payload).toEqual({
      path: '/landing',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'spring_sale',
    });
  });

  it('forwards a single UTM param without requiring the others (M2 optional fields)', async () => {
    sendPageView({ pathname: '/landing', search: '?utm_source=newsletter' });

    const payload = await lastPayload();
    expect(payload).toEqual({
      path: '/landing',
      utmSource: 'newsletter',
    });
    expect(payload).not.toHaveProperty('utmMedium');
    expect(payload).not.toHaveProperty('utmCampaign');
  });

  it('omits UTM params when not present in the URL (M2 optional fields)', async () => {
    sendPageView({ pathname: '/landing', search: '?foo=bar' });

    const payload = await lastPayload();
    expect(payload).toEqual({ path: '/landing' });
    expect(payload).not.toHaveProperty('utmSource');
    expect(payload).not.toHaveProperty('utmMedium');
    expect(payload).not.toHaveProperty('utmCampaign');
  });

  it('omits empty UTM param values (utm_source= with no value)', async () => {
    sendPageView({ pathname: '/landing', search: '?utm_source=' });

    const payload = await lastPayload();
    expect(payload).toEqual({ path: '/landing' });
    expect(payload).not.toHaveProperty('utmSource');
  });

  it('forwards the full M2 payload shape when all sources are present', async () => {
    documentReferrer = 'https://www.facebook.com/';
    sendPageView({
      pathname: '/landing',
      search:
        '?utm_source=facebook&utm_medium=social&utm_campaign=launch&gclid=abc123',
    });

    const payload = await lastPayload();
    expect(payload).toEqual({
      path: '/landing',
      referrer: 'https://www.facebook.com/',
      utmSource: 'facebook',
      utmMedium: 'social',
      utmCampaign: 'launch',
      adClick: true,
    });
  });
});

// ---------------------------------------------------------------------------
// 9. E-BEACON — transport resilience edge cases (T098, M8, research R1, SC-009).
// ---------------------------------------------------------------------------
// Extends section 4's silent-failure coverage with the specific edge cases
// pinned by the E-BEACON spec entry: a resolved (not merely rejected) 500
// response from the keepalive-fetch fallback, an explicit `sendBeacon`
// `false` return (distinct from `sendBeacon` being entirely unavailable,
// already covered in section 3), and an explicit zero-retry assertion.

describe('sendPageView — E-BEACON transport resilience edge cases (M8, R1, SC-009)', () => {
  it('ingest endpoint 500 (resolved response) -> no thrown error, no console error, page keeps running', async () => {
    // sendBeacon unavailable forces the keepalive-fetch path, which is the
    // only transport that ever observes an HTTP status: sendBeacon's browser
    // contract returns only a boolean queued/not-queued result, never a
    // response status.
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;
    fetchMock.mockResolvedValue({ ok: false, status: 500 } as Response);

    expect(() => sendPageView({ pathname: '/garden-rooms' })).not.toThrow();
    await flushMicrotasks();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // "Page code keeps running": a subsequent, unrelated page view still
    // dispatches normally — the 500 left no broken module-level state.
    sendPageView({ pathname: '/about' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ingest endpoint network-down (fetch rejects) -> no thrown error, page keeps running for the next view', async () => {
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    expect(() => sendPageView({ pathname: '/garden-rooms' })).not.toThrow();
    await flushMicrotasks();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // A later view is unaffected by the earlier rejection.
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 } as Response);
    sendPageView({ pathname: '/contact' });
    await flushMicrotasks();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('sendBeacon returning false (available but not queued) -> keepalive fetch fallback fires exactly once', async () => {
    // Distinct from the section-3 "sendBeacon unavailable" case: here
    // navigator.sendBeacon IS a function and IS called, it simply reports
    // that the browser could not queue the request (e.g. payload/queue
    // limits) — the fallback must still fire.
    sendBeaconMock.mockReturnValue(false);

    sendPageView({ pathname: '/garden-rooms' });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.keepalive).toBe(true);
  });

  it('exactly 0 retries after a sendBeacon throw — no further dispatch without a new page view', async () => {
    sendBeaconMock.mockImplementationOnce(() => {
      throw new Error('sendBeacon synchronous failure');
    });

    sendPageView({ pathname: '/garden-rooms' });
    await flushMicrotasks();

    // One sendBeacon attempt, one fetch fallback attempt, and — critically —
    // no additional attempt appears after settling: the failure is final.
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exactly 0 retries after a rejecting keepalive fetch — no further dispatch without a new page view', async () => {
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = undefined;
    fetchMock.mockRejectedValue(new Error('network down'));

    sendPageView({ pathname: '/garden-rooms' });
    await flushMicrotasks();
    await flushMicrotasks();

    // A single attempt only — the rejection triggers no scheduled retry.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 7. useBeacon hook — exactly one event per page view (M8).
// ---------------------------------------------------------------------------

describe('useBeacon — one event per page view (M8)', () => {
  it('fires exactly one event on initial load and one per pathname change; same-path navigation sends nothing', () => {
    const { rerender } = renderHook(() => useBeacon());

    // Initial document load — exactly one beacon dispatch.
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);

    // SPA navigation to a different pathname — a second dispatch.
    mockLocation.pathname = '/about';
    rerender();
    expect(sendBeaconMock).toHaveBeenCalledTimes(2);

    // Same pathname, search-only change — NOT a route change, no dispatch.
    mockLocation.pathname = '/about';
    mockLocation.search = '?category=garden';
    rerender();
    expect(sendBeaconMock).toHaveBeenCalledTimes(2);

    // A further pathname change resumes dispatching.
    mockLocation.pathname = '/contact';
    mockLocation.search = '';
    rerender();
    expect(sendBeaconMock).toHaveBeenCalledTimes(3);
  });

  it('never dispatches for /admin or /admin/* pathname changes (FR-014)', () => {
    const { rerender } = renderHook(() => useBeacon());
    expect(sendBeaconMock).toHaveBeenCalledTimes(1); // initial '/' load

    mockLocation.pathname = '/admin';
    rerender();
    expect(sendBeaconMock).toHaveBeenCalledTimes(1); // /admin skipped

    mockLocation.pathname = '/admin/analytics';
    rerender();
    expect(sendBeaconMock).toHaveBeenCalledTimes(1); // /admin/* skipped
  });
});
