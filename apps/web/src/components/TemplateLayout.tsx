import React, { useLayoutEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';

// Import template styles to ensure theme-template variables are applied
import '../styles/template.css';

/**
 * Inner layout component that consumes HeaderContext.
 * Separated to allow useHeaderConfig hook usage.
 */
const LayoutContent: React.FC = () => {
  const { config } = useHeaderConfig();
  const location = useLocation();
  const navigationType = useNavigationType();

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Record<string, number>>({});

  useLayoutEffect(() => {
    if (!scrollRef.current) return;

    if (navigationType === 'POP') {
      const savedPosition = scrollPositions.current[location.key];
      if (typeof savedPosition === 'number') {
        scrollRef.current.scrollTop = savedPosition;
      }
    } else {
      scrollRef.current.scrollTop = 0;
    }
  }, [location.pathname, location.key, navigationType]);

  const handleScroll = () => {
    if (scrollRef.current) {
      scrollPositions.current[location.key] = scrollRef.current.scrollTop;
    }
  };
  
  return (
    // Outer container locks the viewport height and prevents body scroll
    <div className="vh-100 w-100 overflow-hidden">
      {/* 
        Scrollable container wraps the content. 
        Removed key forcing remount to maintain scroll state for restoration logic.
      */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="theme-template h-100 overflow-y-auto"
      >
        <div id='template__header-wrapper' className="position-relative w-100">
          <Header variant={config.variant} positionOver={config.positionOver} />
        </div>
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
 * Provides the main layout structure for public pages with Header, Footer,
 * and page content via Outlet. Wraps content in HeaderProvider to allow
 * child pages to customize header appearance.
 */
export const TemplateLayout: React.FC = () => {
  return (
    <HeaderProvider>
      <LayoutContent />
    </HeaderProvider>
  );
};
