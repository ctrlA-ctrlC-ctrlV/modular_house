/**
 * Server-Side Entry Point
 * =============================================================================
 * Exports the render function used by the SSG (Static Site Generation) build process.
 * This entry point is compiled by Vite in SSR mode to generate static HTML for each route.
 * 
 * Key Responsibilities:
 * 1. Takes a URL path as input.
 * 2. Renders the application to a string using ReactDOMServer.
 * 3. Captures the SEO helmet context for head tag injection.
 * 4. Returns the HTML string and helmet state to the prerender script.
 * =============================================================================
 */

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { HelmetProvider, HelmetServerState } from 'react-helmet-async'
import App from './App'

/**
 * Interface for the output of the server-side render function.
 */
interface RenderResult {
  /** The full HTML string of the application body. */
  html: string;
  /** The state captured by React Helmet (title, meta tags, etc.). */
  helmet: HelmetServerState;
}

/**
 * Renders the application for a specific URL on the server.
 * 
 * @param url - The URL path to render (e.g., "/about").
 * @returns An object containing the rendered HTML string and the helmet context.
 */
export function render(url: string): RenderResult {
  // Context object for react-helmet-async to populate with head tags during render.
  const helmetContext: { helmet?: HelmetServerState } = {};

  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      {/* 
        HelmetProvider with 'context' prop collects all SEO data from the tree. 
        Crucial for SSG to extract titles and meta tags for the generated HTML.
      */}
      <HelmetProvider context={helmetContext}>
        {/* 
          StaticRouter is the stateless router for server-side rendering.
          It renders the route matching the 'location' prop purely from props.
        */}
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </React.StrictMode>
  )

  // Ensure helmet context is populated. If no helmet tags were used, it might be undefined, 
  // but HelmetProvider usually initializes it.
  if (!helmetContext.helmet) {
    throw new Error('Helmet context was not populated. Ensure HelmetProvider is working correctly.');
  }

  return { html, helmet: helmetContext.helmet }
}
