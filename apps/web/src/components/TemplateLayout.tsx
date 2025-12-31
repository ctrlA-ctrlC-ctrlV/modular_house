import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { HeaderProvider, useHeaderConfig } from './HeaderContext';

/**
 * Inner layout component that consumes HeaderContext.
 * Separated to allow useHeaderConfig hook usage.
 */
const LayoutContent: React.FC = () => {
  const { config } = useHeaderConfig();
  
  return (
    <div className="theme-rebar">
      <Header variant={config.variant} positionOver={config.positionOver} />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
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
