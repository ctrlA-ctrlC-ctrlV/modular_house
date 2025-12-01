# Quickstart: Template–Skeleton Integration

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
