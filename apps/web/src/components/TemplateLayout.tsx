import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType, matchPath } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';
import { routes } from '../route-config';
import { Seo, PromoBanner, EventNewsBanner } from '@modular-house/ui';
import { GoogleTag, GA_TRACKING_ID } from './GoogleTag';
import { PROMO_CONFIG } from '../data/promo-config';

// Import template styles to ensure theme-template variables are applied globally within this layout
import '../styles/template.css';

/**
 * Inner layout component responsible for structure and scroll management.
 * Separated from TemplateLayout to ensure access to HeaderContext via useHeaderConfig hook.
 */
const LayoutContent: React.FC = () => {
  // Consume header configuration from context (set by child pages)
  const { config } = useHeaderConfig();
  
  // React Router hooks for scroll restoration logic
  const location = useLocation();
  const navigationType = useNavigationType();

  // Reference to the scrollable container
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Store scroll positions for history entries (Map: location.key -> scrollTop)
  const scrollPositions = useRef<Record<string, number>>({});

  /**
   * Tracks the previous pathname to distinguish full page navigations from
   * search-parameter-only updates (e.g., gallery category filter changes).
   * When only the search string changes, scroll position is preserved so the
   * user is not unexpectedly returned to the top of the page.
   */
  const previousPathname = useRef<string>(location.pathname);

  /**
   * Layout Effect: Scroll Restoration Logic
   *
   * Determines the appropriate scroll behaviour after every navigation event:
   *
   * - POP (browser back / forward): Restores the previously saved scroll
   *   position for the target history entry, providing native-like
   *   back/forward navigation.
   *
   * - PUSH / REPLACE with pathname change: Resets scroll to the top of the
   *   page, which is the expected behaviour when landing on a new route.
   *
   * - PUSH / REPLACE without pathname change (search-parameter-only update):
   *   Preserves the current scroll position. This covers in-page filtering
   *   (e.g., the gallery category filter bar) where resetting scroll would
   *   be disorienting for the user.
   *
   * Runs synchronously via useLayoutEffect after all DOM mutations to
   * prevent a visible scroll jump before the browser paints.
   */
  useLayoutEffect(() => {
    if (!scrollRef.current) return;

    const isPathChange = previousPathname.current !== location.pathname;
    previousPathname.current = location.pathname;

    if (navigationType === 'POP') {
      // Restore saved scroll position for browser back/forward navigation
      const savedPosition = scrollPositions.current[location.key];
      if (typeof savedPosition === 'number') {
        scrollRef.current.scrollTop = savedPosition;
      }
    } else if (isPathChange) {
      // Reset scroll to top only when the route pathname changes.
      // Search-parameter-only changes (same pathname, different query string)
      // retain the current scroll position to avoid disrupting the user.
      scrollRef.current.scrollTop = 0;
    }
  }, [location.pathname, location.key, navigationType]);

  /**
   * Persist scroll position during scrolling.
   * This ensures the latest position is available if the user navigates away.
   */
  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.current[location.key] = scrollRef.current.scrollTop;
    }
  };

  // Find the current route definition to retrieve SEO metadata.
  // The routes array is iterated in declaration order; specific paths are listed
  // before the catch-all '*' route to ensure the most precise match wins.
  const currentRoute = routes.find(route => matchPath(route.path, location.pathname));

  // Assemble a single JSON-LD @graph block from the route's schema array.
  // The @graph pattern mirrors the structure used by Yoast SEO and is the
  // recommended approach for emitting multiple schema nodes in one <script>
  // block, avoiding duplicate <script type="application/ld+json"> tags that
  // can confuse structured-data validators.
  //
  // This value is undefined when no schema is defined for the current route,
  // which causes the Seo component to omit the <script> element entirely.
  const jsonLd: Record<string, unknown> | undefined =
    currentRoute?.seo?.schema && currentRoute.seo.schema.length > 0
      ? {
          '@context': 'https://schema.org',
          '@graph': currentRoute.seo.schema.map(schemaDef => ({
            '@type': schemaDef.type,
            ...schemaDef.data,
          })),
        }
      : undefined;

  return (
    // Outer container: locks the viewport height and prevents default body scroll,
    // delegating scrolling to the inner scrollable container.
    <div className="vh-100 w-100 overflow-hidden">
      {/*
        SEO head tag injection for the matched route.

        The Seo component from @modular-house/ui is the single authoritative
        point for all document-head meta tags across every public route.
        It emits: title, description, robots, canonical link, Open Graph tags
        (og:title, og:image, og:locale, og:image:width/height/type,
        article:modified_time), Twitter Card tags, and the consolidated
        JSON-LD @graph block.

        All fields except title are forwarded conditionally — the Seo component
        renders each tag group only when the corresponding prop is defined.
        This ensures legal pages (which carry no openGraph or schema data)
        emit only the minimal canonical + robots tags they require, while
        content pages receive the full enriched tag set.
      */}
      {currentRoute?.seo && (
        <Seo
          title={currentRoute.seo.title}
          description={currentRoute.seo.description}
          canonicalUrl={currentRoute.seo.canonicalUrl}
          robots={currentRoute.seo.robots}
          openGraph={currentRoute.seo.openGraph}
          twitter={currentRoute.seo.twitter}
          jsonLd={jsonLd}
          siteTitleSuffix=" | Modular House"
        />
      )}

      {/* 
        Scrollable Container:
        - Serves as the scrolling viewport for the application content.
        - Manages scroll events for position restoration.
        - overflow-y-auto enables vertical scrolling.
      */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="theme-template h-100 overflow-y-auto"
      >
        {/*
          Promotional banner slot.

          Rendered BEFORE the header wrapper (rather than inside it) so the
          banner always occupies flow space at the very top of the viewport.
          This placement is required for overlay routes where `<Header>` uses
          `position-over` (absolute positioning at top:0 of its wrapper). If
          the banner were nested inside the same wrapper, the absolute header
          would paint over it. Rendering above keeps a single code path for
          both overlay and standard header variants: the banner always shows
          at the top of the page, and the header sits directly beneath it —
          either in flow (standard) or overlaying the hero (positionOver).

          Visibility is driven by PROMO_CONFIG.enabled in data/promo-config.ts
          and is intentionally decoupled from strikethrough price display on
          product surfaces.
        
        {PROMO_CONFIG.enabled && (
          <PromoBanner
            name={PROMO_CONFIG.name}
            endsAt={PROMO_CONFIG.endsAt}
            eyebrow={PROMO_CONFIG.eyebrow}
            variant={config.variant}
          />
        )}*/}

        {/*
          Event news banner slot.

          Rendered immediately under the promo banner so campaign/event
          announcements maintain a consistent top-of-page placement across the
          public site. The component self-expires based on its endsAt prop,
          automatically removing itself without requiring a redeploy.
        */}
        <EventNewsBanner
          logoSrc="/resource/misc/IHS.png"
          logoAlt="PTSB Ideal Home Show logo"
          backgroundSrc="/resource/misc/default_banner_bg.png"
          endsAt="2026-04-26T23:59:59+01:00"
          badgeLabel="SEE US @"
        />

        {/* Header Wrapper: Relative positioning allows absolute positioned headers (overlays) to work correctly */}
        <div id='template__header-wrapper' className="position-relative w-100">
          <Header variant={config.variant} positionOver={config.positionOver} />
        </div>
        
        {/* Main Content Area: Renders the active route component */}
        <main id="template__main-content" tabIndex={-1}>
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

/**
 * TemplateLayout Component
 * 
 * The primary layout structure for public-facing pages.
 * 
 * Architecture:
 * - Wraps content in `HeaderProvider` to allow child routes to dynamically configure the header.
 * - Delegate rendering to `LayoutContent` for context access.
 * - Includes standard Header and Footer.
 */
export const TemplateLayout: React.FC = () => {
  return (
    <HeaderProvider>
      {/* 
        Inject Google Analytics Tag.
        This is placed here to ensure it only runs on public (non-admin) pages 
        that utilize the TemplateLayout.
        The tracking ID is sourced from environment variables for security and flexibility.
      */}
      <GoogleTag trackingId={GA_TRACKING_ID} />
      <LayoutContent />
    </HeaderProvider>
  );
};
