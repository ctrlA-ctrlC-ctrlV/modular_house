import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType, matchPath } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';
import { routes } from '../route-config';
import { SEOHead } from './seo/SEOHead';

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

  // Find the current route definition to retrieve SEO metadata
  // We iterate through the central route config and look for a pattern match against the current pathname.
  // The 'routes' array order ensures that specific paths are matched before the catch-all '*' route.
  const currentRoute = routes.find(route => matchPath(route.path, location.pathname));
  
  return (
    // Outer container: Locks the viewport height and prevents default body scroll
    <div className="vh-100 w-100 overflow-hidden">
      {/* Inject SEO metadata for the matched route if configuration exists */}
      {currentRoute?.seo && (
        <SEOHead config={currentRoute.seo} titleSuffix=" | Modular House" />
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
      <LayoutContent />
    </HeaderProvider>
  );
};
