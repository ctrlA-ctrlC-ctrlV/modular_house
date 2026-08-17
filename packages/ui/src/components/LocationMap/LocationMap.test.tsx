/**
 * LocationMap Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates the rendering behaviour, zoom-control state management, and
 * "Get Directions" URL construction of the LocationMap component. Each test
 * case maps to a specific acceptance criterion from the component contract:
 * an embedded map preview with custom zoom controls, defaulting to the
 * company location but fully overridable via props, plus a one-click
 * directions action that opens Google Maps with the user's current position
 * as the route origin when available.
 *
 * TEST STRATEGY:
 * - Assertions read the embed iframe's `src` and the directions URL passed
 *   to `window.open` via the standard `URL`/`URLSearchParams` APIs rather
 *   than substring matching, so tests stay robust to query-string encoding
 *   or parameter-ordering changes.
 * - `navigator.geolocation` is shadowed with a full mock in every test via
 *   `beforeEach`, mirroring the `Object.defineProperty` technique used by
 *   `apps/web/src/analytics/beacon.ts`'s test suite for `navigator.sendBeacon`.
 *   The real Geolocation API must never be exercised: headless Chromium has
 *   no way to grant or deny the permission prompt, so a real call would hang
 *   or behave nondeterministically.
 * - `window.open` is spied on and stubbed to a no-op in every test so no
 *   real tab/window is ever opened by the test browser.
 * - No "any" types are used; geolocation callback payloads are asserted via
 *   the standard `GeolocationPosition`/`GeolocationPositionError` DOM types.
 *
 * ENVIRONMENT:
 * Runs in a browser context via Vitest + Playwright with @testing-library/react
 * (see packages/ui/vite.config.ts — both the "unit" and "storybook" test
 * projects execute against real headless Chromium, not jsdom).
 *
 * =============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LocationMap } from './LocationMap';

/* =============================================================================
   SECTION 1: FIXTURE DATA
   -----------------------------------------------------------------------------
   Expected defaults mirror the component contract: the map defaults to the
   company headquarters when no location props are supplied. These are
   asserted as literal values (black-box) rather than imported from the
   component module, so the tests verify observable behaviour, not internal
   constant names.
   ============================================================================= */

const DEFAULT_ADDRESS = 'Unit 8, Finches Business Park, Long Mile road Dublin 12, D12 N9YV';
const DEFAULT_LATITUDE = '53.32437176761306';
const DEFAULT_LONGITUDE = '-6.33862216498834';
const DEFAULT_LOCATION_NAME = 'Our Location';
const DEFAULT_MAP_TITLE = `Map showing ${DEFAULT_LOCATION_NAME}`;

/* =============================================================================
   SECTION 2: TEST HELPERS
   -----------------------------------------------------------------------------
   Small utilities for reading query parameters out of a URL string without
   relying on substring matching, which would be fragile to encoding or
   parameter-order changes.
   ============================================================================= */

function getParam(url: string, key: string): string | null {
  return new URL(url).searchParams.get(key);
}

function hasParam(url: string, key: string): boolean {
  return new URL(url).searchParams.has(key);
}

function getMapIframe(): HTMLIFrameElement {
  return screen.getByTitle(DEFAULT_MAP_TITLE) as HTMLIFrameElement;
}

/**
 * Local aliases for the Geolocation success/error callback shapes. The DOM
 * lib's own `PositionCallback`/`PositionErrorCallback` type names are not
 * recognised by this project's ESLint global configuration, so equivalent
 * local types are declared here instead.
 */
type GeolocationSuccessCallback = (position: GeolocationPosition) => void;
type GeolocationErrorCallback = (error: GeolocationPositionError) => void;

/* =============================================================================
   SECTION 3: MOCK SCAFFOLDING
   -----------------------------------------------------------------------------
   Shadows `navigator.geolocation` and `window.open` for every test. Both are
   reinstalled fresh in `beforeEach` and torn down in `afterEach` so no
   mock state or DOM leaks between test cases.
   ============================================================================= */

let getCurrentPositionMock: ReturnType<typeof vi.fn>;
let windowOpenSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getCurrentPositionMock = vi.fn();

  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: getCurrentPositionMock,
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    configurable: true,
    writable: true,
  });

  windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* =============================================================================
   SECTION 4: TEST SUITE
   ============================================================================= */

describe('LocationMap', () => {
  /* ---------------------------------------------------------------------
     GROUP A: Initial render / defaults
     --------------------------------------------------------------------- */

  it('renders an embed iframe reflecting the default company location and zoom', () => {
    render(<LocationMap />);

    const iframe = getMapIframe();
    expect(iframe.tagName).toBe('IFRAME');

    const src = iframe.getAttribute('src') ?? '';
    expect(getParam(src, 'q')).toBe(`${DEFAULT_LATITUDE},${DEFAULT_LONGITUDE}`);
    expect(getParam(src, 'z')).toBe('15');
    expect(getParam(src, 'output')).toBe('embed');
  });

  it('renders zoom and directions controls', () => {
    render(<LocationMap />);

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Get Directions' })).toBeDefined();
  });

  it('renders the address text', () => {
    render(<LocationMap />);

    expect(screen.getByText(DEFAULT_ADDRESS)).toBeDefined();
  });

  it('renders zoom and directions controls as native, keyboard-operable buttons', () => {
    render(<LocationMap />);

    const buttons = [
      screen.getByRole('button', { name: 'Zoom in' }),
      screen.getByRole('button', { name: 'Zoom out' }),
      screen.getByRole('button', { name: 'Get Directions' }),
    ];

    /**
     * Native <button type="button"> elements are keyboard-operable and
     * focusable by default; this guards against a future regression to a
     * non-button (e.g. a clickable <div>) that would silently drop that
     * accessibility guarantee.
     */
    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
    });
  });

  /* ---------------------------------------------------------------------
     GROUP B: Zoom-in behaviour
     --------------------------------------------------------------------- */

  it('clicking zoom in increments the zoom level reflected in the iframe src', () => {
    render(<LocationMap />);

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    const src = getMapIframe().getAttribute('src') ?? '';
    expect(getParam(src, 'z')).toBe('16');
  });

  it('clicking zoom in repeatedly clamps at maxZoom', () => {
    render(<LocationMap zoom={20} maxZoom={20} />);

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    const src = getMapIframe().getAttribute('src') ?? '';
    expect(getParam(src, 'z')).toBe('20');
  });

  it('disables the zoom in button when the initial zoom equals maxZoom', () => {
    render(<LocationMap zoom={20} maxZoom={20} />);

    expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveProperty('disabled', true);
  });

  /* ---------------------------------------------------------------------
     GROUP C: Zoom-out behaviour
     --------------------------------------------------------------------- */

  it('clicking zoom out decrements the zoom level reflected in the iframe src', () => {
    render(<LocationMap />);

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));

    const src = getMapIframe().getAttribute('src') ?? '';
    expect(getParam(src, 'z')).toBe('14');
  });

  it('clicking zoom out repeatedly clamps at minZoom', () => {
    render(<LocationMap zoom={3} minZoom={3} />);

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));

    const src = getMapIframe().getAttribute('src') ?? '';
    expect(getParam(src, 'z')).toBe('3');
  });

  it('disables the zoom out button when the initial zoom equals minZoom', () => {
    render(<LocationMap zoom={3} minZoom={3} />);

    expect(screen.getByRole('button', { name: 'Zoom out' })).toHaveProperty('disabled', true);
  });

  /* ---------------------------------------------------------------------
     GROUP D: Directions -- geolocation succeeds
     --------------------------------------------------------------------- */

  it('opens directions with both origin and destination when geolocation succeeds', () => {
    getCurrentPositionMock.mockImplementation((success: GeolocationSuccessCallback) => {
      success({
        coords: { latitude: 53.35, longitude: -6.26 },
      } as GeolocationPosition);
    });

    render(<LocationMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const url = windowOpenSpy.mock.calls[0]?.[0] as string;

    expect(getParam(url, 'api')).toBe('1');
    expect(getParam(url, 'origin')).toBe('53.35,-6.26');
    expect(getParam(url, 'destination')).toBe(`${DEFAULT_LATITUDE},${DEFAULT_LONGITUDE}`);
    expect(getParam(url, 'travelmode')).toBe('driving');
  });

  it('uses a custom travel mode in the directions URL when provided', () => {
    getCurrentPositionMock.mockImplementation((success: GeolocationSuccessCallback) => {
      success({
        coords: { latitude: 53.35, longitude: -6.26 },
      } as GeolocationPosition);
    });

    render(<LocationMap travelMode="walking" />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));

    const url = windowOpenSpy.mock.calls[0]?.[0] as string;
    expect(getParam(url, 'travelmode')).toBe('walking');
  });

  it('invokes onDirectionsClick with the computed URL and origin flag on success', () => {
    getCurrentPositionMock.mockImplementation((success: GeolocationSuccessCallback) => {
      success({
        coords: { latitude: 53.35, longitude: -6.26 },
      } as GeolocationPosition);
    });

    const handleDirectionsClick = vi.fn();
    render(<LocationMap onDirectionsClick={handleDirectionsClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));

    expect(handleDirectionsClick).toHaveBeenCalledTimes(1);
    const [url, usedOrigin] = handleDirectionsClick.mock.calls[0] as [string, boolean];
    expect(usedOrigin).toBe(true);
    expect(getParam(url, 'origin')).toBe('53.35,-6.26');
  });

  /* ---------------------------------------------------------------------
     GROUP E: Directions -- geolocation errors / is denied
     --------------------------------------------------------------------- */

  it('falls back to a destination-only directions URL when geolocation errors', () => {
    getCurrentPositionMock.mockImplementation(
      (_success: GeolocationSuccessCallback, error?: GeolocationErrorCallback | null) => {
        error?.({
          code: 1,
          message: 'User denied Geolocation',
        } as GeolocationPositionError);
      },
    );

    render(<LocationMap />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const url = windowOpenSpy.mock.calls[0]?.[0] as string;

    expect(hasParam(url, 'origin')).toBe(false);
    expect(getParam(url, 'destination')).toBe(`${DEFAULT_LATITUDE},${DEFAULT_LONGITUDE}`);
  });

  it('invokes onDirectionsClick with usedOrigin false on the error fallback', () => {
    getCurrentPositionMock.mockImplementation(
      (_success: GeolocationSuccessCallback, error?: GeolocationErrorCallback | null) => {
        error?.({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError);
      },
    );

    const handleDirectionsClick = vi.fn();
    render(<LocationMap onDirectionsClick={handleDirectionsClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));

    const [, usedOrigin] = handleDirectionsClick.mock.calls[0] as [string, boolean];
    expect(usedOrigin).toBe(false);
  });

  /* ---------------------------------------------------------------------
     GROUP F: Directions -- geolocation entirely unsupported
     --------------------------------------------------------------------- */

  it('falls back to a destination-only directions URL without throwing when geolocation is unsupported', () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    render(<LocationMap />);

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Get Directions' }));
    }).not.toThrow();

    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    const url = windowOpenSpy.mock.calls[0]?.[0] as string;
    expect(hasParam(url, 'origin')).toBe(false);
    expect(getParam(url, 'destination')).toBe(`${DEFAULT_LATITUDE},${DEFAULT_LONGITUDE}`);
  });

  /* ---------------------------------------------------------------------
     GROUP G: Prop overrides
     --------------------------------------------------------------------- */

  it('reflects custom location, name, address, and zoom props', () => {
    render(
      <LocationMap
        locationName="Second Office"
        address="1 Example Road, Example Town"
        latitude={10}
        longitude={20}
        zoom={8}
      />,
    );

    const iframe = screen.getByTitle('Map showing Second Office') as HTMLIFrameElement;
    const src = iframe.getAttribute('src') ?? '';

    expect(getParam(src, 'q')).toBe('10,20');
    expect(getParam(src, 'z')).toBe('8');
    expect(screen.getByText('1 Example Road, Example Town')).toBeDefined();
  });

  /* ---------------------------------------------------------------------
     GROUP H: Structural / miscellaneous prop wiring
     --------------------------------------------------------------------- */

  it('applies className and id to the root element', () => {
    const { container } = render(<LocationMap className="custom-class" id="hq-map" />);

    const root = container.firstElementChild as HTMLElement;
    expect(root.id).toBe('hq-map');
    expect(root.className).toContain('custom-class');
  });
});
