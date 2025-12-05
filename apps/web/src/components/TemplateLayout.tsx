import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export const TemplateLayout: React.FC = () => {
  return (
    <div className="theme-rebar">
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
