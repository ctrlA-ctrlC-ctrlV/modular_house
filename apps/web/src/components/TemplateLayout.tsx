import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';

// Import template styles to ensure theme-rebar variables are applied
import '../styles/template.css';

/**
 * Inner layout component that consumes HeaderContext.
 * Separated to allow useHeaderConfig hook usage.
 */
const LayoutContent: React.FC = () => {
  const { config } = useHeaderConfig();
  const location = useLocation();
  
  return (
    // Outer container locks the viewport height and prevents body scroll
    <div className="vh-100 w-100 overflow-hidden">
      {/* 
        Scrollable container wraps the content. 
        key={location.pathname} forces a re-mount on navigation, resetting scroll to top.
      */}
      <div 
        key={location.pathname}
        className="theme-rebar h-100 overflow-y-auto"
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
