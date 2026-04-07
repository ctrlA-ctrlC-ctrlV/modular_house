# Accessibility Standards

---

## Focus Management

### Focus Ring
- **Color**: `#4f46e5` (indigo-600)
- **Width**: 2px outline
- **Offset**: 2px from element edge
- **High-contrast mode**: Width increases to 3px

### Focus Behavior
- All interactive elements (links, buttons, inputs, modals) receive visible focus indicators
- Focus transitions are instant (no animation delay)
- Tab order follows DOM order (semantic HTML structure)

```css
:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  :focus-visible {
    outline-width: 3px;
  }
}
```

---

## Keyboard Navigation

| Component | Keys | Behavior |
|-----------|------|----------|
| Header menu | Tab, Enter, Escape | Navigate items, open/close dropdowns |
| AccordionFAQ | Enter, Space | Toggle expand/collapse |
| QuickViewModal | Escape | Close modal |
| EnquiryFormModal | Escape | Close modal |
| FullMassonryGallery lightbox | Escape, Arrow keys | Close, navigate images |
| Form inputs | Tab | Move between fields |
| Buttons | Enter, Space | Activate |

---

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

When enabled:
- All hover transforms are disabled (no scale, translate)
- Carousel sliding is replaced with instant transitions
- Fade-in animations are removed
- Gallery zoom effects are removed

---

## Semantic HTML

- `<header>` for site navigation
- `<main>` wrapping page content
- `<section>` with heading hierarchy (h1 → h2 → h3)
- `<footer>` for site footer
- `<nav>` for navigation menus
- `<button>` for interactive controls (not `<div onClick>`)
- `<a>` for navigation links

---

## Image Accessibility

### OptimizedImage Component
- `alt` attribute is required on all images
- Decorative images use `alt=""`
- `<picture>` element provides format fallbacks (AVIF → WebP → original)

### Hero Images
- Background images supplemented with descriptive text content
- Not relied upon for conveying information

---

## Color Contrast

### Text Contrast Ratios (Target: WCAG AA)

| Combination | Ratio | Pass |
|-------------|-------|------|
| `#1a1a1a` on `#FEFEFE` (ink on primary bg) | ~16:1 | AA/AAA |
| `#121414` on `#FEFEFE` (title on primary bg) | ~17:1 | AA/AAA |
| `#555555` on `#FEFEFE` (slate on primary bg) | ~7.5:1 | AA/AAA |
| `#888888` on `#FEFEFE` (stone on primary bg) | ~3.5:1 | AA (large text only) |
| `#ACAFB2` on `#FEFEFE` (meta on primary bg) | ~2.5:1 | Decorative only |
| `#B55329` on `#FEFEFE` (brand-link on primary bg) | ~4.5:1 | AA |
| `#fefefe` on `#1A1714` (white on dark bg) | ~16:1 | AA/AAA |

### Known Limitations
- `--brand-meta` (#ACAFB2) does not meet AA contrast on white backgrounds. Use only for non-essential decorative text or ensure minimum 18px / bold 14px size.
- `--brand-stone` (#888888) passes only for large text (≥ 18px or ≥ 14px bold).

---

## ARIA Patterns

- Modal dialogs use `role="dialog"` with `aria-modal="true"`
- Accordion items use `aria-expanded` to indicate state
- Gallery lightbox traps focus within the overlay
- Form fields use `<label>` elements or `aria-label` attributes
- Status banners use `role="status"` for live announcements

---

## Responsive Accessibility

- Touch targets: Minimum 44×44px on mobile
- Hamburger menu: Clear icon + accessible label
- Carousel: Dot indicators provide visual position feedback
- Forms stack vertically on mobile for easy thumb reach
