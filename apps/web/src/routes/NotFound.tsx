/**
 * NotFound Route Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders the 404 "Page Not Found" page displayed when no route matches
 * the current URL. This is the catch-all route registered as path "*"
 * in route-config.tsx.
 *
 * DESIGN:
 * Implements the approved prototype from .template/misc/notfound_prototype.html.
 * The layout centres a large "404" display numeral, a brief explanation, and
 * two action buttons (Back to Home + View Our Projects) vertically and
 * horizontally within the viewport.
 *
 * ARCHITECTURE:
 * - Header is configured for dark variant with position overlay so it sits
 *   transparently over the page background, matching the About page pattern.
 * - SEO metadata (title, robots) is handled by TemplateLayout via
 *   routes-metadata.ts; this component does not render its own <Seo> tag.
 * - Header and footer are rendered by the parent TemplateLayout; this
 *   component renders only the main content area.
 * - Navigation uses React Router <Link> for client-side transitions.
 * - The decorative architecture icon is rendered as an inline SVG to avoid
 *   a dependency on the Material Symbols icon font.
 *
 * STYLING:
 * Page-level styles are defined in NotFound.css using BEM naming with
 * block "not-found". All colour and typography values reference design
 * tokens defined in style.css and tokens.css.
 *
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHeaderConfig } from '../components/HeaderContext';
import './NotFound.css';


/* ---------------------------------------------------------------------------
   Navigation Link Configuration
   ---------------------------------------------------------------------------
   Defines the target routes for the two CTA buttons. Centralised here so
   that route paths are easy to update without searching through JSX.
   --------------------------------------------------------------------------- */

/** Route path for the primary "Back to Home" action */
const HOME_PATH = '/';

/** Route path for the secondary "View Our Projects" action */
const PROJECTS_PATH = '/gallery';


/* ---------------------------------------------------------------------------
   Component Definition
   ---------------------------------------------------------------------------
   Configures the site header to use the dark variant with absolute
   positioning so it overlays the page background. The cleanup function
   resets to the same config to prevent flash-of-unstyled-header during
   route transitions.
   --------------------------------------------------------------------------- */

const NotFound: React.FC = () => {
  const { setHeaderConfig } = useHeaderConfig();
  useEffect(() => {
    setHeaderConfig({ variant: 'dark', positionOver: true });

    return () => {
      setHeaderConfig({ variant: 'dark', positionOver: true });
    };
  }, [setHeaderConfig]);

  return (
    <main className="not-found">
      <div className="not-found__content">

        {/* =================================================================
            404 Display Numeral
            =================================================================
            Large typographic element using the brand serif font (Special
            Gothic Condensed One). The gradient accent line beneath it
            is rendered via CSS (not-found__accent-line) to maintain the
            visual connection with the brand CTA gradient.
            ================================================================= */}
        <div className="not-found__code">
          <h1 className="not-found__code-text">404</h1>
          <div className="not-found__accent-line" aria-hidden="true" />
        </div>

        {/* =================================================================
            Explanatory Text
            =================================================================
            A concise heading and description that inform the user the
            requested page was not found and invite them to navigate
            elsewhere. Copy matches the approved prototype.
            ================================================================= */}
        <div className="not-found__text-group">
          <h2 className="not-found__heading">Page Not Found</h2>
          <p className="not-found__description">
            Sorry, the page you're looking for doesn't exist or has been
            moved. Let's get you back on track.
          </p>
        </div>

        {/* =================================================================
            Action Buttons
            =================================================================
            Two CTA buttons: a primary solid button linking to the home page
            and a secondary outlined button linking to the gallery/projects
            page. Both use React Router <Link> for client-side navigation
            without full page reloads.
            ================================================================= */}
        <div className="not-found__actions">
          <Link
            to={HOME_PATH}
            className="not-found__action-btn not-found__action-btn--primary"
          >
            Back to Home
          </Link>
          <Link
            to={PROJECTS_PATH}
            className="not-found__action-btn not-found__action-btn--secondary"
          >
            View Our Projects
          </Link>
        </div>

        {/* =================================================================
            Decorative Architectural Icon
            =================================================================
            A subtle SVG icon rendered below the action buttons reinforcing
            the construction/architecture brand identity. Marked as
            aria-hidden since it is purely decorative and carries no
            semantic meaning.
            ================================================================= */}
        <div className="not-found__decorative-icon" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            fill="currentColor"
          >
            {/* Google Material Symbols "architecture" icon path */}
            <path d="M262-160v-304l-82 79-37-40 297-287 297 287-38 40-82-79v304H262Zm60-60h157v-133h6v133h157v-271L440-682 322-491v271Zm-1-370q-21-1-40-14.5T254-639l29-12q8 17 21.5 25t28.5 8q38 0 45-40h30q0 21 12.5 34.5T451-610q33 0 44-37h30q-1 35-23 50.5t-51 15.5q-25 0-42-14t-22-36q-8 31-28.5 43.5T321-575v-15Zm119 93Z" />
          </svg>
        </div>

      </div>
    </main>
  );
};

export default NotFound;