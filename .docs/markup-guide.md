# Markup & CSS Guide

Purpose: Consistent, accessible, and maintainable HTML/CSS across Modular House.

- Audience: Engineers building `apps/web` UI and shared `packages/ui` components.
- Scope: Class naming, component structure, accessibility patterns, and examples.

## Principles

- Semantic first: Prefer native HTML elements and attributes over divs.
- Accessible by default: Keyboard, focus states, labels, roles, aria-* always considered.
- Progressive enhancement: Core functionality without JS; enhance with JS when needed.
- Predictable naming: BEM-inspired classes, stable and readable.
- Small, composable components: Clear inputs/outputs, no hidden side effects.

## Class Naming Convention (BEM-Inspired)

- Block: `.c-Component` – independent, reusable component (e.g., `.c-button`).
- Element: `.c-Component__part` – child inside a block (e.g., `.c-card__title`).
- Modifier: `.c-Component--variant` – stylistic/behavioral variation (e.g., `.c-button--primary`).

Prefixes:
- `c-` components, `l-` layout, `u-` utilities, `js-` JS hooks (no visual styles).

Examples:
- `.c-button`, `.c-button--primary`, `.c-button--ghost`
- `.c-card`, `.c-card__title`, `.c-card__media`, `.c-card--featured`
- `.l-container`, `.l-stack`, `.l-cluster`
- `.u-sr-only`, `.u-visually-hidden`, `.u-text-center`

Avoid tying class names to content or one-off locations. Prefer intent (role/variant).

## File Organization

- Global styles: `apps/web/src/index.css` and `apps/web/src/styles/` (e.g., `focus.css`).
- Component styles: colocate in component directory if needed (e.g., `Button.css`).
- Shared tokens (colors, spacing) live in CSS variables in `:root` in `index.css`.

Suggested CSS file per component (when non-trivial):
- `Component.tsx`
- `Component.css` (imports in `Component.tsx` or `main.tsx` once when shared)

## Accessibility Patterns

- Always provide `aria-label`, `aria-labelledby`, or visible text for interactive controls.
- Use `role` only when semantics are not provided by native elements.
- Keyboard:
  - All controls reachable via Tab; use `:focus-visible` with `focus.css`.
  - Manage focus on dialogs/lightboxes (use Radix Dialog as implemented).
  - Return focus to the invoking element on close.
- Forms:
  - Use `<label for>` or wrap inputs with `<label>`; include error text and `aria-describedby`.
  - Mark required fields with `required`; do not rely solely on color.
- Images:
  - Always provide `alt`; if decorative, use `alt=""`.
- Skip link:
  - Provide a `.skip-to-main` link as first focusable element on pages.

## Layout Utilities

- `.l-container`: page max-width and horizontal padding.
- `.l-stack`: vertical rhythm; children separated by a fixed gap.
- `.l-cluster`: horizontal grouping with wrap; gap for spacing.
- Keep layout classes minimal; prefer composition rather than deep nesting.

Example CSS (optional to add as project grows):
```css
.l-container { max-width: 72rem; margin-inline: auto; padding-inline: 1rem; }
.l-stack > * + * { margin-block-start: 1rem; }
.l-cluster { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
```

## Components

### Buttons

HTML:
```html
<button class="c-button c-button--primary" type="button">Call to action</button>
```

States and variants:
- `c-button--primary`, `c-button--secondary`, `c-button--ghost`
- Disabled: `disabled` attribute; ensure contrast remains acceptable.

### Cards

HTML:
```html
<article class="c-card">
  <img class="c-card__media" src="/img.jpg" alt="Description" />
  <h3 class="c-card__title">Card title</h3>
  <p class="c-card__body">Summary text…</p>
</article>
```

### Forms

HTML (with errors and descriptions):
```html
<div class="c-field">
  <label for="email" class="c-field__label">Email</label>
  <input id="email" name="email" type="email" class="c-field__input" aria-describedby="email-hint email-error" required />
  <div id="email-hint" class="c-field__hint">We will reply to this address.</div>
  <div id="email-error" class="c-field__error" role="alert">Please enter a valid email.</div>
  
  <!-- Honeypot (hidden from assistive tech) -->
  <input type="text" class="u-visually-hidden" autocomplete="off" tabindex="-1" aria-hidden="true" />
  
  <!-- Consent -->
  <label class="c-checkbox">
    <input type="checkbox" name="consent" required />
    <span>I agree to the privacy policy.</span>
  </label>
</div>
```

### Navigation

HTML:
```html
<nav aria-label="Main">
  <ul class="c-nav">
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li><a href="/gallery">Gallery</a></li>
    <li><a href="/contact" class="c-button c-button--primary">Contact</a></li>
  </ul>
  <a class="skip-to-main" href="#main">Skip to main content</a>
  
  <!-- Ensure focus styles from styles/focus.css are loaded globally -->
</nav>
```

### Dialog/Lightbox (Radix Dialog)

- Use the Radix primitives already in the project; ensure `aria` attributes are not overridden.
- Trap focus within the dialog; return focus to trigger on close.

## Utilities

- `.u-sr-only` / `.u-visually-hidden`: Hide visually, keep accessible to screen readers.
- `.u-text-center`, `.u-text-right`: Text alignment helpers.
- Keep utility set small; prefer component classes for visual design.

Example CSS:
```css
.u-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
```

## Do/Don’t

- Do: Use semantic tags (`header`, `main`, `footer`, `nav`, `section`, `article`).
- Do: Keep class names stable; treat them as API.
- Do: Keep variants explicit via `--modifier` classes.
- Don’t: Use IDs for styling; reserve for form control linkage.
- Don’t: Over-nest selectors; target classes directly.
- Don’t: Encode colors/sizes in class names; use tokens or modifiers.

## Example: Page Skeleton

```html
<header class="c-header">
  <!-- logo, nav -->
</header>

<main id="main" class="l-container l-stack" tabindex="-1">
  <h1>Page title</h1>
  <section class="c-section">
    <h2 class="c-section__title">Section</h2>
    <p>Content…</p>
  </section>
</main>

<footer class="c-footer">
  <!-- footer content -->
</footer>
```

## Review Checklist

- Semantic HTML used throughout; landmark regions present.
- Focus styles visible and consistent (`styles/focus.css`).
- Names follow `c-`, `l-`, `u-` prefixes and BEM structure.
- Forms have labels, hints, error messages, and proper `aria-*`.
- Images include meaningful `alt` text (or empty for decorative).
- Dialogs/lightboxes return focus and support Escape close.

## References

- WCAG 2.1 AA: Focus, keyboard, forms
- WAI-ARIA Authoring Practices
- BEM Methodology (modified for `c-`/`l-`/`u-` prefixes)
