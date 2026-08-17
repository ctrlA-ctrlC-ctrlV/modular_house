/**
 * LocationMap Component
 * =============================================================================
 *
 * PURPOSE:
 * Displays a location as an embedded Google Maps preview with custom zoom
 * controls, and a one-click "Get Directions" action that opens Google Maps
 * with turn-by-turn directions from the visitor's current position to the
 * displayed location. Defaults to the company headquarters but is fully
 * prop-driven so any page can display a different location.
 *
 * ARCHITECTURE:
 * - The map preview renders via the keyless Google Maps embed endpoint
 *   (`https://maps.google.com/maps?...&output=embed`), avoiding any new
 *   dependency, API key, or billing setup.
 * - Zoom in/out is implemented as component-owned +/- buttons rather than
 *   relying on the embed iframe's native zoom UI. The iframe is
 *   cross-origin, so its internal zoom gestures are opaque to both
 *   automated tests and keyboard-only users of the host page; explicit
 *   buttons keep zoom directly testable and consistently operable.
 * - "Get Directions" uses Google's universal directions link format
 *   (`https://www.google.com/maps/dir/?api=1&...`), which the OS
 *   auto-routes to the native Maps app on iOS/Android when installed, or
 *   the web app otherwise. This removes the need for manual mobile/user-agent
 *   detection to satisfy the "app on mobile, new tab on desktop" requirement.
 * - When the visitor's position is available, it is sent as the directions
 *   origin. When geolocation is denied, errors, or is unsupported by the
 *   browser, the origin parameter is omitted entirely and Google Maps
 *   resolves "your location" on its own — the click handler never throws or
 *   blocks in these cases, since directions are a convenience feature, not
 *   a critical path.
 * - Follows the Open-Closed Principle: `travelMode`, `zoomStep`, and the
 *   observational `onDirectionsClick` callback are additive extension
 *   points that do not alter default behaviour when omitted.
 *
 * ACCESSIBILITY:
 * - The embed iframe carries a `title` attribute so assistive technology
 *   announces it as "iframe, {title}" rather than an unlabelled frame.
 * - Zoom and directions controls are native `<button type="button">`
 *   elements, which are keyboard-operable and focusable without any extra
 *   handling, and pick up the site-wide `*:focus-visible` ring for free.
 * - Zoom buttons are `disabled` (native attribute, removing them from the
 *   tab order) once the clamp boundary is reached, rather than silently
 *   no-op'ing on further clicks.
 *
 * =============================================================================
 */

import React, { useCallback, useMemo, useState } from 'react';
import './LocationMap.css';

/* =============================================================================
   SECTION 1: DEFAULT LOCATION CONSTANTS
   -----------------------------------------------------------------------------
   Company headquarters, used whenever a consumer does not supply an explicit
   location. Declared once here to avoid duplicating magic numbers/strings
   across the component and its defaults.
   ============================================================================= */

const DEFAULT_LOCATION_NAME = 'Our Location';
const DEFAULT_ADDRESS = 'Unit 8, Finches Business Park, Long Mile road Dublin 12, D12 N9YV';
const DEFAULT_LATITUDE = 53.32437176761306;
const DEFAULT_LONGITUDE = -6.33862216498834;

const DEFAULT_ZOOM = 15;
const DEFAULT_MIN_ZOOM = 3;
const DEFAULT_MAX_ZOOM = 20;
const DEFAULT_ZOOM_STEP = 1;

/* =============================================================================
   SECTION 2: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   ============================================================================= */

/**
 * Google Maps travel mode, forwarded verbatim into the directions URL's
 * `travelmode` query parameter.
 */
export type LocationMapTravelMode = 'driving' | 'walking' | 'bicycling' | 'transit';

/**
 * Props contract for the LocationMap component.
 *
 * Every field is optional: with zero props, the component renders the
 * company headquarters at a sensible default zoom.
 */
export interface LocationMapProps {
  /** Display name for the location, used in the map's accessible title. @default 'Our Location' */
  locationName?: string;

  /** Human-readable postal address, shown as supporting text beneath the map. @default company HQ address */
  address?: string;

  /** Latitude of the pinned location, decimal degrees (WGS84). @default 53.32437176761306 (company HQ) */
  latitude?: number;

  /** Longitude of the pinned location, decimal degrees (WGS84). @default -6.33862216498834 (company HQ) */
  longitude?: number;

  /** Initial embed zoom level. Clamped to [minZoom, maxZoom] on mount. @default 15 */
  zoom?: number;

  /** Minimum allowed zoom level. @default 3 */
  minZoom?: number;

  /** Maximum allowed zoom level. @default 20 */
  maxZoom?: number;

  /** Amount the zoom in/out buttons change the zoom level per click. @default 1 */
  zoomStep?: number;

  /** Travel mode forwarded to the "Get Directions" URL. @default 'driving' */
  travelMode?: LocationMapTravelMode;

  /** Accessible title for the embedded map iframe. @default `Map showing ${locationName}` */
  mapTitle?: string;

  /** Accessible label for the zoom-in button. @default 'Zoom in' */
  zoomInLabel?: string;

  /** Accessible label for the zoom-out button. @default 'Zoom out' */
  zoomOutLabel?: string;

  /** Visible and accessible label for the directions button. @default 'Get Directions' */
  directionsLabel?: string;

  /**
   * Optional observational callback invoked with the computed directions
   * URL immediately before `window.open` is called, on every click
   * regardless of whether geolocation succeeded. Does not replace or
   * block the default open behaviour; provided as an additive extension
   * point (Open-Closed) for callers that need a hook (e.g. analytics)
   * without altering the default contract.
   */
  onDirectionsClick?: (url: string, usedOrigin: boolean) => void;

  /** Optional CSS class appended to the root element. */
  className?: string;

  /** Optional id attribute for the root element (e.g. anchor linking). */
  id?: string;
}

/** A simple {latitude, longitude} pair used internally for URL construction. */
interface Coordinates {
  lat: number;
  lng: number;
}

/* =============================================================================
   SECTION 3: ICON COMPONENTS
   -----------------------------------------------------------------------------
   Minimal inline SVG icons for the zoom and directions controls, following
   the project's established icon convention (viewBox, stroke-based glyphs).
   ============================================================================= */

const PlusIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.75" strokeLinecap="round">
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="2" y1="8" x2="14" y2="8" />
  </svg>
);

const MinusIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.75" strokeLinecap="round">
    <line x1="2" y1="8" x2="14" y2="8" />
  </svg>
);

const DirectionsIcon: React.FC = () => (
  <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="8 1.5 14.5 14.5 8 11 1.5 14.5" />
  </svg>
);

/* =============================================================================
   SECTION 4: PURE HELPERS
   -----------------------------------------------------------------------------
   URL-construction logic is factored out of the component body so it can be
   reasoned about (and, if ever needed, tested) independently of React state.
   ============================================================================= */

/** Clamps `value` to the inclusive [min, max] range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds the keyless Google Maps embed iframe `src` for a given location and
 * zoom level. `URLSearchParams` is used (rather than manual string
 * concatenation) so query values are correctly percent-encoded and remain
 * parseable via the standard `URL` API by consumers/tests.
 */
function buildEmbedSrc(latitude: number, longitude: number, zoom: number): string {
  const params = new URLSearchParams({
    q: `${latitude},${longitude}`,
    z: String(zoom),
    output: 'embed',
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

/**
 * Builds a Google Maps universal directions URL. When `origin` is provided,
 * the route starts from that position; when omitted, Google Maps resolves
 * "your location" on its own. Parameters are set in `origin`, `destination`,
 * `travelmode` order purely for readability of the resulting URL string —
 * Google Maps does not require a specific parameter order.
 */
function buildDirectionsUrl(
  destination: Coordinates,
  travelMode: LocationMapTravelMode,
  origin?: Coordinates,
): string {
  const params = new URLSearchParams({ api: '1' });
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  params.set('destination', `${destination.lat},${destination.lng}`);
  params.set('travelmode', travelMode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/* =============================================================================
   SECTION 5: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * LocationMap
 *
 * Renders an embedded map preview with custom zoom controls and a
 * "Get Directions" action.
 *
 * @param props - Configuration conforming to LocationMapProps
 * @returns A `<section>` element containing the map, zoom controls, address, and directions button
 */
export const LocationMap: React.FC<LocationMapProps> = ({
  locationName = DEFAULT_LOCATION_NAME,
  address = DEFAULT_ADDRESS,
  latitude = DEFAULT_LATITUDE,
  longitude = DEFAULT_LONGITUDE,
  zoom = DEFAULT_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  zoomStep = DEFAULT_ZOOM_STEP,
  travelMode = 'driving',
  mapTitle,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  directionsLabel = 'Get Directions',
  onDirectionsClick,
  className,
  id,
}) => {
  /**
   * Current zoom level. Initialised from the `zoom` prop, clamped to
   * [minZoom, maxZoom] so an out-of-range initial value cannot render an
   * inconsistent button-disabled state.
   */
  const [currentZoom, setCurrentZoom] = useState<number>(() => clamp(zoom, minZoom, maxZoom));

  const resolvedMapTitle = mapTitle ?? `Map showing ${locationName}`;

  const embedSrc = useMemo(
    () => buildEmbedSrc(latitude, longitude, currentZoom),
    [latitude, longitude, currentZoom],
  );

  const isAtMinZoom = currentZoom <= minZoom;
  const isAtMaxZoom = currentZoom >= maxZoom;

  const handleZoomIn = useCallback((): void => {
    setCurrentZoom((previous) => clamp(previous + zoomStep, minZoom, maxZoom));
  }, [zoomStep, minZoom, maxZoom]);

  const handleZoomOut = useCallback((): void => {
    setCurrentZoom((previous) => clamp(previous - zoomStep, minZoom, maxZoom));
  }, [zoomStep, minZoom, maxZoom]);

  /**
   * Attempts to read the visitor's current position, then opens Google
   * Maps directions in a new tab/window. Falls back to a destination-only
   * URL whenever geolocation is unsupported, errors, or is denied — the
   * handler never throws, since directions remain useful (Google Maps
   * resolves the visitor's location itself) even without a precise origin.
   */
  const handleDirectionsClick = useCallback((): void => {
    const destination: Coordinates = { lat: latitude, lng: longitude };

    const openDirections = (origin?: Coordinates): void => {
      const url = buildDirectionsUrl(destination, travelMode, origin);
      onDirectionsClick?.(url, origin !== undefined);
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      openDirections(undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        openDirections({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        openDirections(undefined);
      },
    );
  }, [latitude, longitude, travelMode, onDirectionsClick]);

  /**
   * Assembles the root element's CSS class list using BEM methodology:
   * - Block: `location-map`
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = ['location-map', className ?? ''].filter(Boolean).join(' ');

  return (
    <section className={rootClassName} id={id}>
      <div className="location-map__frame-wrapper">
        {/* Keyless Google Maps embed preview, re-rendered with each zoom change. */}
        <iframe
          className="location-map__iframe"
          src={embedSrc}
          title={resolvedMapTitle}
          loading="lazy"
        />

        {/* Custom zoom controls, overlaid on the map's corner. */}
        <div className="location-map__controls">
          <button
            type="button"
            className="location-map__zoom-button"
            onClick={handleZoomIn}
            disabled={isAtMaxZoom}
            aria-label={zoomInLabel}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            className="location-map__zoom-button"
            onClick={handleZoomOut}
            disabled={isAtMinZoom}
            aria-label={zoomOutLabel}
          >
            <MinusIcon />
          </button>
        </div>
      </div>

      <div className="location-map__footer">
        <p className="location-map__address">{address}</p>

        <button
          type="button"
          className="location-map__directions-button"
          onClick={handleDirectionsClick}
        >
          <span className="location-map__directions-icon" aria-hidden="true">
            <DirectionsIcon />
          </span>
          {directionsLabel}
        </button>
      </div>
    </section>
  );
};
