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
