# Styles Guide

This app integrates the Rebar template styles in a reversible, scoped way.

## Import Order (critical)

Ensure imports in `apps/web/src/main.tsx` follow this order:

1. `./styles/tokens.css` — design tokens (variables)
2. `./styles/template.css` — template utilities and base styles (scoped)
3. `./index.css` — app-specific overrides
4. `./styles/focus.css` — additional focus/utility rules (optional)

Current `main.tsx` confirms this order.

## Scope & Wrapper

- All template styles are scoped under the `.theme-rebar` class.
- The layout component `TemplateLayout` applies this root class and renders `Header`, `Footer`, and a `main` region with `id="main-content"` and `tabIndex={-1}` for accessibility.

## Rollback Steps (reversible)

To temporarily disable the template integration while keeping code paths intact:

1. In `apps/web/src/App.tsx`, swap the public route layout from `TemplateLayout` back to `PublicLayout` (the previous layout is preserved in the file for quick rollback).
2. In `apps/web/src/main.tsx`, comment out or remove the `./styles/template.css` import. Keep `tokens.css` if other parts of the app rely on variables; otherwise you can comment it out too.
3. Verify focus handling still works. The `main` landmark with `id="main-content"` should remain so skip links continue to function.
4. No other code changes are required; assets under `/public/template` remain but are unused.

## Notes

- Keep `template.css` minimal and focused on utilities (container, typography, focus) to avoid unnecessary bundle size.
- App overrides should live in `index.css` and assume template styles load first.
- Avoid adding global element selectors outside the `.theme-rebar` scope to reduce bleed-through.
