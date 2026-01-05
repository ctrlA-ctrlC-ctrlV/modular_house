/**
 * Application Entry Point
 * =============================================================================
 * 
 * STYLE IMPORT ORDER (CRITICAL):
 * 1. Bootstrap 5 CSS - Base framework styles
 * 2. UI Package style.css - Component styles from @modular-house/ui
 * 3. Brand style.css - Design tokens and Bootstrap overrides
 * 4. index.css - Application-specific styles
 * 5. focus.css - Focus state accessibility enhancements
 * 
 * This order ensures:
 * - Bootstrap provides the base layer
 * - Component styles build upon Bootstrap
 * - Brand tokens override both for consistent theming
 * - App-specific and focus styles apply last
 * =============================================================================
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'
// import '@modular-house/ui/style.css'
import './styles/style.css'
import './index.css'
import './styles/focus.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)