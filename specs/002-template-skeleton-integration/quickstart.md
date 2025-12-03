# Quickstart: Template–Skeleton Integration

## Overview

This guide explains how the Rebar template assets are integrated into the web app, where branding tokens come from, and how to use them safely. It also covers import order, asset locations, and reversible steps.

## Token Sources

- Source files: `.template/rebar/theme.json`, `.template/rebar/style.scss`, `.template/rebar/css/_theme-vars.scss`
- Extracted into CSS variables in `apps/web/src/styles/tokens.css`.

### Current variables

Defined in `apps/web/src/styles/tokens.css`:

```
:root {
  --theme-color-bg-color: #FFFFFF;
  --theme-color-bg-color-2: #F6F5F0;
  --theme-color-bd-color: #E5E7DE;
  --theme-color-title: #121414;
  --theme-color-meta: #ACAFB2;
  --theme-color-link: #B55329;
  --theme-color-hover: #9F4017;
  --theme-font-family-base: "Inter", sans-serif;
  --theme-spacing-unit: 8px;
}
```

To add more tokens, review `theme.json` palette and typography, then append corresponding `--theme-*` variables to `tokens.css`.

## Usage Pattern

- Reference variables in application styles via `var(--theme-...)`.
- Example:

```
.c-button-primary {
  color: #fff;
  background-color: var(--theme-color-link);
}

.u-link {
  color: var(--theme-color-link);
}
.u-link:hover {
  color: var(--theme-color-hover);
}
```

## Import Order

Import order ensures template styles are applied first, then overridden by app styles if needed.

- File: `apps/web/src/main.tsx`
- Order:
  1. `./styles/tokens.css`
  2. `./styles/template.css`
  3. `./index.css`
  4. `./styles/focus.css`

This order is already configured.

## Scoped Wrapper

- Scope template rules under `.theme-rebar` to prevent global bleed.
- File: `apps/web/src/styles/template.css`
- Example root wrapper (added in Phase 2):

```
<div className="theme-rebar">
  {/* header, main, footer */}
</div>
```

## Assets

- Copied images live under: `apps/web/public/template/images/`
- Reference with absolute path from the app: `/template/images/...`

### PowerShell commands

Use PowerShell to refresh assets from the template directory:

```
Copy-Item -Path ".template/rebar/images" -Destination "apps/web/public/template/images" -Recurse
```

## Reversibility

- Keep tokens and template styles isolated. To roll back, remove `template.css` import from `main.tsx` and switch layout away from `.theme-rebar` (Phase 2).

## Testing Notes

- Ensure visible focus indicators remain after token updates.
- Validate color contrast when changing palette values.

## Prerequisites
- PNPM installed
- Workspace bootstrapped (`pnpm install` at repo root)

## Verification Criteria (User Story 1)

To confirm that the template integration is working correctly for the initial 6+ routes, verify the following:

1.  **Dev Run**: The application builds and starts without errors.
    ```powershell
    pnpm -C apps/web build
    pnpm -C apps/web dev
    ```
    -   Navigate to `/`, `/about`, `/gallery`, `/contact`, `/privacy`, `/terms`, `/garden-room`, `/house-extension`.
    -   Ensure each page renders with the template header, footer, and uses the `l-container` class for the main content area.

2.  **Test Pass**: All tests, including new route rendering and accessibility tests, pass.
    ```powershell
    pnpm -C apps/web run test:run
    ```
    -   Expected output: `Test Files 3 passed (3)`, `Tests 43 passed (43)` (or more).
    -   Key tests: `src/test/routes/template-layout.test.tsx` and `src/test/routes/focus-indicators.test.tsx`.

## Steps

1. Copy template assets
   - From `.template/rebar/` copy required images/fonts to `apps/web/public/template/`.

2. Create styles
   - `apps/web/src/styles/tokens.css`: define CSS variables (`--mh-...`) mapped from `.template/rebar/style.scss`.
   - `apps/web/src/styles/template.css`: import selected CSS from the template or paste compiled CSS (scoped-ready).

3. Import styles in `apps/web/src/main.tsx`
   - Import order: `template.css` first, then existing `index.css`.

4. Introduce `Layout` wrapper
   - Add `apps/web/src/components/Layout.tsx` that applies `.theme-rebar` and renders header/footer with template classes.
   - Wrap public routes with `Layout`.

5. Update components/routes
   - Apply `c-`, `l-`, `u-` classes to shared components and pages.

6. Run and verify
   - Dev: `pnpm -C apps/web dev`
   - Tests: `pnpm -C apps/web test:run`

## Reversibility
- To revert, swap `Layout` wrapper back to the existing layout and remove the `.theme-rebar` import.

## Accessibility Checks
- Verify focus indicators, ARIA labels, and color contrast on all updated pages.

## Template Class Naming (Adopted) [US2]

This project adopts the template naming conventions for clarity and portability. Classes are scoped under `.theme-rebar` and use prefixes to indicate purpose:

- `c-` Component classes: semantic wrappers and UI parts
- `l-` Layout classes: containers, grids, spacing structure
- `u-` Utility classes: single-purpose helpers (color, spacing, visibility, focus)

### Narrative Examples

- Header: The site header uses `c-header` with a nested navigation `c-nav`. Within `TemplateLayout`, the header region renders the brand and menu items using these classes to ensure consistent spacing and focus styles under `.theme-rebar`.
- Gallery: The grid container uses `c-gallery`, and each interactive card uses `c-gallery__item`. Cards are keyboard-accessible (`role="button"`, `tabIndex={0}`) and preserve focus indicators.
- Pages: Public pages wrap main content in `l-container` to align text widths and spacing with template defaults while allowing app-specific typography overrides.

### Current Adoption

- `apps/web/src/components/Header.tsx`: `c-header`, `c-nav`
- `apps/web/src/components/GalleryGrid.tsx`: `c-gallery`, `c-gallery__item`
- Public routes (`Landing`, `About`, `Gallery`, `Contact`, `Privacy`, `Terms`, `GardenRoom`, `HouseExtension`): `l-container` on top-level wrappers

## Class Reference Guide [US2]

Comprehensive reference of adopted classes and typical usage. All examples assume the `.theme-rebar` scope is applied at the root via `TemplateLayout`.

### Component (`c-`) classes

- `c-header`: Site header wrapper
  - Purpose: Top banner region containing brand and primary navigation
  - Usage:
    ```tsx
    <header className="c-header" role="banner">
      <nav className="c-nav" role="navigation" aria-label="Primary">
        {/* links */}
      </nav>
    </header>
    ```

- `c-nav`: Primary navigation container
  - Purpose: Horizontal nav with visible focus styles and accessible labels
  - Usage: Inside `c-header` as shown above

- `c-gallery`: Gallery grid container
  - Purpose: Defines spacing and responsive grid behavior for gallery items
  - Usage:
    ```tsx
    <div className="c-gallery">
      {/* c-gallery__item children */}
    </div>
    ```

- `c-gallery__item`: Interactive gallery card
  - Purpose: Focusable, keyboard-activated card to open lightbox or details
  - Usage:
    ```tsx
    <div
      className="c-gallery__item"
      role="button"
      tabIndex={0}
      aria-label={`View ${item.title}`}
    >
      {/* image + caption */}
    </div>
    ```

### Layout (`l-`) classes

- `l-container`: Page content container with max-width and horizontal padding
  - Purpose: Constrain content for readability and consistent margins
  - Usage:
    ```tsx
    <main id="main-content" tabIndex={-1} className="l-container">
      {/* route content */}
    </main>
    ```

### Utility (`u-`) classes

- `u-sr-only`: Screen-reader-only text (visually hidden, accessible)
  - Purpose: Provide accessible labels or descriptions without visual noise
  - Usage:
    ```tsx
    <span className="u-sr-only">Skip to main content</span>
    ```

- `u-focus` (example focus helper applied via stylesheet):
  - Purpose: Ensure visible focus ring consistent with template tokens
  - Usage: Applied via selectors to interactive components within `.theme-rebar`

- `u-link`: Standard link color and hover behavior driven by tokens
  - Usage:
    ```html
    <a class="u-link" href="/privacy">Privacy Policy</a>
    ```

### Token-driven styling

- Colors and typography derive from `apps/web/src/styles/tokens.css`.
- Example mapping:
  ```css
  .u-link { color: var(--theme-color-link); }
  .u-link:hover { color: var(--theme-color-hover); }
  ```

### Scope and Order

- Scope: `.theme-rebar` wrapper prevents bleed into unrelated views.
- Import order: `tokens.css`, `template.css`, `index.css`, `focus.css` (already configured).

### PowerShell Tips (CLI)

- Validate web build and run tests:
  ```powershell
  pnpm -C apps/web build
  pnpm -C apps/web run test:run
  ```

- Copy refreshed template assets:
  ```powershell
  Copy-Item -Path ".template/rebar/images" -Destination "apps/web/public/template/images" -Recurse
  ```
