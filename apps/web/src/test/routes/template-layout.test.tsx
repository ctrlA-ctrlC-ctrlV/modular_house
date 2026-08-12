import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from '../../App';

// Mock components to isolate layout testing
vi.mock('../../components/Header', () => ({
  default: () => <header data-testid="template-header">Header</header>
}));

vi.mock('../../components/Footer', () => ({
  default: () => <footer data-testid="template-footer">Footer</footer>
}));

// Mock page components to verify routing
vi.mock('../../routes/Landing', () => ({ default: () => <div data-testid="page-landing">Landing Page</div> }));
vi.mock('../../routes/About', () => ({ default: () => <div data-testid="page-about">About Page</div> }));
vi.mock('../../routes/Gallery', () => ({ default: () => <div data-testid="page-gallery">Gallery Page</div> }));
vi.mock('../../routes/Contact', () => ({ default: () => <div data-testid="page-contact">Contact Page</div> }));
vi.mock('../../routes/Privacy', () => ({ default: () => <div data-testid="page-privacy">Privacy Page</div> }));
vi.mock('../../routes/Terms', () => ({ default: () => <div data-testid="page-terms">Terms Page</div> }));
vi.mock('../../routes/GardenRoom', () => ({ default: () => <div data-testid="page-garden-room">Garden Room Page</div> }));
vi.mock('../../routes/HouseExtension', () => ({ default: () => <div data-testid="page-house-extension">House Extension Page</div> }));
vi.mock('../../routes/NotFound', () => ({ default: () => <div data-testid="page-404">404 Page</div> }));

/**
 * Renders the full application at the specified route path inside the required
 * providers: HelmetProvider (required by react-helmet-async for head tag
 * management) and MemoryRouter (required by react-router-dom for in-memory
 * navigation without a real browser history API).
 *
 * Using the full App tree rather than TemplateLayout directly ensures that
 * the route-matching logic in TemplateLayout receives an authentic location
 * context, which is what drives SEO metadata selection.
 */
const renderRoute = (route: string): void => {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>
  );
};

// ---------------------------------------------------------------------------
// T051 — page-view beacon transport mocks (beacon.ts `useBeacon` hook).
// ---------------------------------------------------------------------------
// Once T052 mounts the `useBeacon` hook in TemplateLayout, every public route
// render dispatches a page-view event via `navigator.sendBeacon` (with a
// keepalive `fetch` fallback, research R1). No real network call may leave the
// test process (constitution I/III), so both transports are mocked at the
// module boundary. The mocks are installed once for the whole file so the
// pre-existing `it.each` route tests are also protected after T052 lands —
// without them, mounting the hook would cause real fetch calls against the
// ingest URL inside every existing route test.
const sendBeaconMock = vi.fn<(url: string, data: Blob) => boolean>();

beforeAll(() => {
  // jsdom does not implement `navigator.sendBeacon`; define it as a mock that
  // reports success so the keepalive-fetch fallback branch never executes.
  Object.defineProperty(navigator, 'sendBeacon', {
    value: sendBeaconMock,
    configurable: true,
    writable: true,
  });
  // Stub `fetch` so the fallback path (taken only when sendBeacon is absent or
  // returns false) also stays in-process and never reaches the network.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, status: 204 } as Response)),
  );
});

beforeEach(() => {
  // Re-arm the sendBeacon mock with a success return before every test; tests
  // that need the fallback branch reassign `navigator.sendBeacon` themselves.
  sendBeaconMock.mockReset();
  sendBeaconMock.mockReturnValue(true);
  // Clear any cookies set by the beacon (`mh_vid`/`mh_sid`) or CookieBanner
  // (`mh_cookie_ack`) in a prior test so each route render starts from a clean
  // cookie jar — the banner renders only while `mh_cookie_ack` is absent.
  document.cookie.split(';').forEach((part) => {
    const name = part.trim().split('=')[0];
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  });
});

describe('TemplateLayout Integration', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it.each([
    ['/', 'page-landing'],
    ['/about', 'page-about'],
    ['/gallery', 'page-gallery'],
    ['/contact', 'page-contact'],
    ['/privacy', 'page-privacy'],
    ['/terms', 'page-terms'],
    ['/garden-rooms', 'page-garden-room'],
    ['/house-extensions', 'page-house-extension'],
    ['/unknown-route', 'page-404'],
  ])('renders TemplateLayout for route %s', async (route, testId) => {
    renderRoute(route);

    // Verify layout components are present
    expect(await screen.findByTestId('template-header')).toBeInTheDocument();
    expect(screen.getByTestId('template-footer')).toBeInTheDocument();

    // Verify the specific page content is rendered
    expect(screen.getByTestId(testId)).toBeInTheDocument();

    // Verify the layout wrapper class (.theme-template)
    // The Header is inside a wrapper div, which is inside the theme wrapper
    const header = screen.getByTestId('template-header');
    // Header component mock renders <header>, so parentElement is #template__header-wrapper
    const headerWrapper = header.parentElement;
    // #template__header-wrapper's parent is the .theme-template div
    const wrapper = headerWrapper?.parentElement;
    expect(wrapper).toHaveClass('theme-template');

    // Verify main content area attributes
    const main = wrapper?.querySelector('main');
    expect(main).toHaveAttribute('id', 'template__main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });
});

/**
 * T015a — Open Graph meta tag injection tests.
 *
 * These integration tests verify that TemplateLayout correctly delegates
 * SEO metadata to the Seo component from @modular-house/ui, and that the
 * Seo component writes Open Graph tags into document.head.
 *
 * Two branches are validated:
 * 1. A route whose metadata includes an openGraph configuration emits
 *    og:title into document.head.
 * 2. A route whose metadata omits openGraph does not emit og:title, guarding
 *    against unconditional tag rendering that would corrupt social previews
 *    on pages not configured for social sharing.
 *
 * react-helmet-async writes to document.head asynchronously after the React
 * render cycle completes. waitFor is required to allow that flush before
 * querying document.head.
 *
 * Route choices:
 * - /garden-rooms: has a fully populated openGraph block in routes-metadata.ts.
 * - /privacy: is a legal page intentionally configured with no openGraph block.
 */
describe('TemplateLayout — Open Graph meta tag injection (T015a)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('emits og:title into document.head when the matched route has an openGraph configuration', async () => {
    // Render at /garden-rooms, which carries a full openGraph block in routes-metadata.ts.
    // The expected og:title value is sourced directly from that metadata entry to ensure
    // the test remains tightly coupled to the data source rather than a hardcoded string
    // that could drift out of sync with the metadata.
    renderRoute('/garden-rooms');

    await waitFor(() => {
      const ogTitleTag = document.querySelector('meta[property="og:title"]');

      // Assert the tag exists in document.head — absence would indicate the Seo
      // component is not receiving the openGraph prop from TemplateLayout.
      expect(ogTitleTag).not.toBeNull();

      // Assert the content matches the value declared in routes-metadata.ts for
      // the /garden-rooms entry, confirming end-to-end data propagation.
      expect(ogTitleTag).toHaveAttribute('content', 'Garden Rooms Ireland | Steel Frame from 15m\u00B2 to 45m\u00B2');
    });
  });

  it('does not emit og:title into document.head when the matched route has no openGraph configuration', async () => {
    // Render at /privacy, which is a legal page intentionally excluded from social
    // enrichment. Its routes-metadata.ts entry has no openGraph field.
    renderRoute('/privacy');

    // Allow react-helmet-async to flush any pending head writes before asserting
    // absence. Without waitFor, the assertion could pass trivially before the
    // Helmet effect runs, producing a false negative.
    await waitFor(() => {
      // Assert no og:title tag is present. A non-null result would mean the Seo
      // component is emitting og:title unconditionally, which would cause social
      // crawlers to display incorrect or empty titles for legal pages.
      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      expect(ogTitleTag).toBeNull();
    });
  });
});

/**
 * T051 — CookieBanner + beacon mount assertions (plan §4.3 AMEND #1).
 *
 * TemplateLayout is the enforced single mount point for the cookie notice and
 * the page-view beacon (FR-001, SC-001, plan §1.1). These assertions extend
 * — and do not replace — the existing render coverage above: the banner must
 * appear in the DOM and the beacon hook must dispatch exactly once per route
 * render. No other TemplateLayout behavior changes; the pre-existing `it.each`
 * suite above remains the regression guard for header/footer/main/SEO behavior.
 *
 * The suite is red until T052 mounts both `CookieBanner` and the `useBeacon`
 * hook inside TemplateLayout.
 */
describe('TemplateLayout — CookieBanner + beacon mount (T051)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mounts CookieBanner inside the public layout', async () => {
    renderRoute('/');

    // CookieBanner mounts client-side only (N2): the `mounted` flag flips
    // inside useEffect, so the testid appears only after the effect flushes.
    // `findByTestId` waits for that flush; before T052 the banner is never
    // mounted and this assertion times out — the expected red state.
    expect(await screen.findByTestId('cookie-banner')).toBeInTheDocument();
  });

  it('fires the page-view beacon exactly once per route render', async () => {
    renderRoute('/');

    // The `useBeacon` hook (beacon.ts) calls `sendPageView` in a useEffect
    // keyed on `location.pathname`; one mount at a single pathname dispatches
    // exactly one event (M8). `navigator.sendBeacon` is mocked at the module
    // boundary (see file-level setup) so no real network call leaves the test
    // process (research R1). Before T052 the hook is never mounted and the
    // call count stays at zero — the expected red state.
    await waitFor(() => {
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    });
  });

  it('fires the beacon once for a different public route too', async () => {
    // A second route confirms the beacon is not specific to `/` — every
    // public page render dispatches exactly one event (FR-001, SC-001).
    renderRoute('/about');

    await waitFor(() => {
      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    });
  });
});
