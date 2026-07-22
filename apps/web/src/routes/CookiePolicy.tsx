/**
 * Cookie Policy Page Component
 * =============================================================================
 *
 * PURPOSE:
 * Renders the full cookie policy for Modular House (modularhouse.ie) at the
 * public `/cookie-policy` route. The page's cookie table is rendered directly
 * from `cookieRegister.ts` (plan §2.2 N4, research R9) — no copy of the data —
 * so introducing a future cookie only requires a new register entry; this
 * page never needs to change (FR-027).
 *
 * SEO:
 * Meta tags (title, description, canonical, robots) are injected by
 * TemplateLayout via the route metadata defined in routes-metadata.ts. This
 * component does not render its own <Seo /> block, to avoid duplicate head
 * elements (follows routes/Privacy.tsx's convention).
 *
 * STRUCTURE:
 * - Hero header with page title and introductory statement
 * - Cookie register table: name, purpose, category, duration, set by
 *
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { useHeaderConfig } from '../components/HeaderContext';
import { COOKIE_REGISTER } from '../content/cookieRegister';

/**
 * Cookie Policy Page Component
 *
 * Stateless functional component that renders the complete cookie register
 * as a table. All content is driven by the `COOKIE_REGISTER` constant,
 * making the addition of a future cookie a data-only change (Open-Closed,
 * FR-027).
 */
function CookiePolicy(): React.ReactElement {
  const { setHeaderConfig } = useHeaderConfig();

  /* ---------------------------------------------------------------------------
     Header Configuration
     ---------------------------------------------------------------------------
     Sets the site header to the light variant with position overlay disabled,
     matching the other legal/content pages (Privacy, Terms).
     --------------------------------------------------------------------------- */
  useEffect(() => {
    setHeaderConfig({ variant: 'light', positionOver: false });
  }, [setHeaderConfig]);

  return (
    <div className="bg-white">
      <div className="l-container py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">

          {/* ---------------------------------------------------------------
              PAGE HEADER
              --------------------------------------------------------------- */}
          <div className="text-center">
            <h1 className="u-text-h1 text-4xl font-extrabold text-gray-900">
              Cookie Policy
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              What cookies we use, why, and for how long.
            </p>
          </div>

          {/* ---------------------------------------------------------------
              INTRODUCTORY STATEMENT
              --------------------------------------------------------------- */}
          <div className="mt-12 prose prose-lg mx-auto">
            <p className="text-gray-600">
              Modular House uses a small number of first-party cookies to
              measure how visitors use our site, plus the cookies our admin
              panel needs to keep signed-in administrators authenticated and
              remember their preferences. We do not use cookies for
              third-party advertising or behavioural profiling. The table
              below is the complete, authoritative list of every cookie we
              set — it is generated directly from our codebase, so it always
              reflects exactly what the site does.
            </p>
          </div>

          {/* ---------------------------------------------------------------
              COOKIE REGISTER TABLE
              Rendered 1:1 from COOKIE_REGISTER (research R9) — one row per
              entry, no copy of the data. Adding a cookie to the register
              surfaces here automatically with no page change (FR-027).
              --------------------------------------------------------------- */}
          <div className="mt-8 table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th scope="col">Cookie</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Category</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Set by</th>
                </tr>
              </thead>
              <tbody>
                {COOKIE_REGISTER.map((entry) => (
                  <tr key={entry.name}>
                    <td>
                      <code>{entry.name}</code>
                    </td>
                    <td>{entry.purpose}</td>
                    {/* Raw category value (e.g. "strictly-necessary") — the
                        exact data contract asserted by the T053/T054
                        register-consistency suites; rendered verbatim with
                        no added text so the cell's textContent matches the
                        register entry exactly. */}
                    <td>{entry.category}</td>
                    <td>{entry.duration}</td>
                    <td>{entry.setBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookiePolicy;
