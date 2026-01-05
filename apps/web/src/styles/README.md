# Styles Guide

This app integrates brand styling with Bootstrap 5 through a centralized bridge stylesheet.

## Architecture Overview

The styling system follows the Open-Closed Principle: styles are open for extension via
CSS custom properties but closed for modification of core behavior. The `style.css`
file serves as the single source of truth for design tokens, resolving conflicts between
the shared UI library (`packages/ui`) and this web application.

## Import Order (critical)

Ensure imports in `apps/web/src/main.tsx` follow this order:

1. Bootstrap 5 CSS (framework base)
2. `./styles/style.css` — brand tokens and Bootstrap variable overrides
3. `./styles/tokens.css` — legacy design tokens (variables)
4. `./styles/template.css` — template utilities and base styles (scoped)
5. `./index.css` — app-specific overrides
6. `./styles/focus.css` — additional focus/utility rules

## Bootstrap Bridge Stylesheet

The `style.css` file provides:

- **Brand Design Tokens**: All colors, typography, shadows, and gradients from `packages/ui`
- **Bootstrap 5 Overrides**: Maps brand tokens to Bootstrap CSS custom properties (`--bs-*`)
- **Utility Classes**: Brand-specific extensions following Bootstrap naming conventions
- **Base Element Resets**: Consistent typography and color treatment across the application

### Key Utility Classes

| Class | Purpose |
|-------|---------|
| `.text-eyebrow` | Small uppercase label text |
| `.text-display` | Large display heading |
| `.text-lead` | Larger intro paragraph text |
| `.btn-brand-primary` | Primary call-to-action button |
| `.btn-brand-secondary` | Secondary outlined button |
| `.link-editorial` | Italic serif link style |
| `.input-minimal` | Underlined minimal input field |
| `.shadow-brand-*` | Brand shadow effects |
| `.bg-gradient-*` | Brand gradient backgrounds |

Current `main.tsx` confirms this order.

## Scope & Wrapper

- All template styles are scoped under the `.modular-house` class.
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
- Avoid adding global element selectors outside the `.modular-house` scope to reduce bleed-through.
