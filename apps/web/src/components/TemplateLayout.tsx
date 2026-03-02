import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType, matchPath } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';
import { routes } from '../route-config';
import { Seo } from '@modular-house/ui';
import { GoogleTag, GA_TRACKING_ID } from './GoogleTag';

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
   * Layout Effect: Scroll Restoration Logic
   * Handles restoring scroll position on back/forward navigation ('POP')
   * and resetting scroll to top on new navigation ('PUSH'/'REPLACE').
   * 
   * Runs synchronously after all DOM mutations to prevent visual scroll jump.
   */
  useLayoutEffect(() => {
    if (!scrollRef.current) return;

    if (navigationType === 'POP') {
      // Attempt to restore saved position for this location key
      const savedPosition = scrollPositions.current[location.key];
      if (typeof savedPosition === 'number') {
        scrollRef.current.scrollTop = savedPosition;
      }
    } else {
      // Reset scroll to top for new pages
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
