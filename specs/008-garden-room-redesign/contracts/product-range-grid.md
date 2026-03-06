# Component Contract: ProductRangeGrid

**Feature**: 008-garden-room-redesign
**Package**: `packages/ui/src/components/ProductRangeGrid/`

## Interface

```typescript
import { type LinkRenderer } from '../types';

export interface ProductCard {
  /** Display size label, e.g., "15m²" */
  size: string;
  /** Product name, e.g., "Compact Studio" */
  name: string;
  /** Primary image path (PNG/JPEG fallback) */
  image: string;
  /** WebP optimized image variant */
  imageWebP?: string;
  /** AVIF optimized image variant */
  imageAvif?: string;
  /** List of typical use cases */
  useCases: string[];
  /** Planning permission status note */
  planningNote: string;
  /** Optional badge text ("Most Popular", "Coming Soon") */
  badge?: string;
  /** CTA button label */
  ctaText: string;
  /** CTA navigation target (with query params) */
  ctaLink: string;
  /** Whether the product is currently orderable */
  available: boolean;
}

export interface ProductRangeGridProps {
  /** Section eyebrow text (uppercase, small) */
  eyebrow?: string;
  /** Section heading (h2, serif font) */
  title?: string;
  /** Section description paragraph */
  description?: string;
  /** Product card data array */
  products: ProductCard[];
  /** Custom link renderer for SPA navigation */
  renderLink?: LinkRenderer;
}
```

## Rendering Contract

### Layout
- **Desktop (1280px+)**: 4-column CSS Grid, equal-width columns, gap: 24px
- **Tablet (768-1279px)**: 2-column CSS Grid, gap: 20px
- **Mobile (<768px)**: 1-column stack, gap: 16px
- **Max-width container**: Content constrained within existing `.l-container` equivalent
- **Vertical padding**: 80px top / 80px bottom

### Card Structure
Each card renders in this order (top to bottom):
1. **Image** — `<picture>` with AVIF/WebP/PNG sources via OptimizedImage; aspect ratio ~3:2
2. **Badge** (if present) — Absolute positioned top-right of image area
3. **Size + Name** — Size in large text, name below
4. **Use Cases** — Bulleted or comma-separated list
5. **Planning Note** — Small text, colour-coded (green for "no permission", amber for "legislation pending")
6. **CTA Button** — Full-width within card

### Visual Variants

**Available product** (`available: true`):
- Solid border (1px, light grey)
- Full opacity image
- Badge: brand colour background (e.g., "Most Popular" in rust-orange)
- CTA: Filled button (rust-orange background, white text)

**Coming soon product** (`available: false`):
- Dashed border (2px, light grey)
- Image opacity: 0.7
- Badge: muted grey background ("Coming Soon")
- CTA: Outline button (rust-orange border, rust-orange text, transparent background)

### CSS Class Convention (BEM)
```
.product-range-grid                          /* Block: section wrapper */
.product-range-grid__header                  /* Element: eyebrow + title + description */
.product-range-grid__eyebrow                 /* Element: uppercase label */
.product-range-grid__title                   /* Element: h2 heading */
.product-range-grid__description             /* Element: intro paragraph */
.product-range-grid__grid                    /* Element: CSS Grid container */

.product-range-card                          /* Block: individual card */
.product-range-card--coming-soon             /* Modifier: unavailable variant */
.product-range-card__image-wrapper           /* Element: image container */
.product-range-card__badge                   /* Element: badge overlay */
.product-range-card__badge--popular          /* Modifier: "Most Popular" style */
.product-range-card__badge--coming-soon      /* Modifier: "Coming Soon" style */
.product-range-card__size                    /* Element: size label */
.product-range-card__name                    /* Element: product name */
.product-range-card__use-cases               /* Element: use case list */
.product-range-card__planning-note           /* Element: planning status */
.product-range-card__cta                     /* Element: CTA button */
.product-range-card__cta--outline            /* Modifier: outline variant */
```

### Accessibility
- Section uses `<section>` with `aria-labelledby` pointing to the title's `id`
- Each card is a semantic `<article>` element
- Badge text is visible (not icon-only) — no additional ARIA needed
- CTA buttons use `<a>` (via renderLink) with descriptive text including size: e.g., "Get a Quote for 25m² Garden Suite"
- Images have descriptive `alt` text including product size and name
- Focus-visible states on all interactive elements (CTA buttons)

### Semantic HTML Structure
```html
<section class="product-range-grid" aria-labelledby="product-range-title">
  <div class="product-range-grid__header">
    <p class="product-range-grid__eyebrow">OUR RANGE</p>
    <h2 id="product-range-title" class="product-range-grid__title">Choose Your Perfect Size</h2>
    <p class="product-range-grid__description">...</p>
  </div>
  <div class="product-range-grid__grid">
    <article class="product-range-card">
      <div class="product-range-card__image-wrapper">
        <!-- OptimizedImage here -->
        <span class="product-range-card__badge product-range-card__badge--popular">Most Popular</span>
      </div>
      <p class="product-range-card__size">25m²</p>
      <h3 class="product-range-card__name">Garden Suite</h3>
      <ul class="product-range-card__use-cases">
        <li>Home office</li>
        <li>Home gym</li>
      </ul>
      <p class="product-range-card__planning-note">No planning permission required</p>
      <a class="product-range-card__cta" href="/contact?product=garden-room-25">Get a Quote</a>
    </article>
    <!-- ... more cards -->
  </div>
</section>
```
