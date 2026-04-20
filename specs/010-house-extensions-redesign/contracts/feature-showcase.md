# Component Contract: FeatureShowcase

**Feature**: 010-house-extensions-redesign
**Package**: `packages/ui/src/components/FeatureShowcase/`
**Template reference**: `.template/house-extensions/house-extensions-design.html` — Sections 4 & 5

---

## Interface

```typescript
export interface FeatureShowcaseItem {
  /** Material Symbols icon name (e.g. "thermostat", "verified") */
  icon: string;
  /** Feature heading text */
  title: string;
  /** Feature description paragraph */
  description: string;
}

export interface FeatureShowcaseBadge {
  /** Large display value (e.g. "100%") */
  value: string;
  /** Small uppercase label below the value (e.g. "STEEL FRAME") */
  label: string;
}

export type FeatureShowcaseBg = 'white' | 'beige' | 'gray';

export interface FeatureShowcaseProps {
  /** Uppercase eyebrow label above the heading */
  eyebrow: string;
  /** Section heading (h2). Supports JSX for line breaks. */
  title: React.ReactNode;
  /** Lead paragraph below the heading */
  description: string;
  /** List of icon + title + description feature items */
  features: FeatureShowcaseItem[];
  /** Image URL — PNG/JPEG fallback */
  imageSrc: string;
  /** WebP variant of the image */
  imageWebP?: string;
  /** AVIF variant of the image */
  imageAvif?: string;
  /** Descriptive alt text for the image */
  imageAlt: string;
  /** Optional floating stat badge overlaid on the image corner */
  badge?: FeatureShowcaseBadge;
  /** When true, image renders on the left and text on the right (default: false) */
  reversed?: boolean;
  /** Section background colour variant (default: 'white') */
  backgroundColor?: FeatureShowcaseBg;
  /** Icon container style: 'filled' = icon inside a tinted box, 'outlined' = bare icon (default: 'filled') */
  iconVariant?: 'filled' | 'outlined';
  /** Custom link renderer for React Router integration */
  renderLink?: LinkRenderer;
  /** Optional CSS class for the root <section> element */
  className?: string;
}
```

---

## Implementation Steps

### Step 1 — Scaffold files

Create the component folder and empty files:

```
packages/ui/src/components/FeatureShowcase/
├── FeatureShowcase.tsx
├── FeatureShowcase.css
└── FeatureShowcase.test.tsx
```

### Step 2 — Build the text column

Inside `FeatureShowcase.tsx`, start with the **text column** — the side containing all textual content. This is the more complex half and is independent of layout direction.

Implement as a `<div>` containing (top to bottom):

1. **Eyebrow** — `<span>`, uppercase, wide tracking, small font, brand accent colour.
2. **Heading** — `<h2>`, display/serif font, bold. Rendered via `{props.title}` to support JSX (e.g. `<br />`).
3. **Description** — `<p>`, body font, large size, secondary text colour, bottom margin to separate from feature list.
4. **Feature list** — `<ul>` with `role="list"`. Each `FeatureShowcaseItem` renders as an `<li>` containing:
   - **Icon container** — a `<div>` that changes based on `iconVariant`:
     - `'filled'` (default): tinted background box (`--brand-bg-secondary`), `padding: 0.5rem`, rounded, icon in accent colour.
     - `'outlined'`: no background, icon rendered at 24px in accent colour.
   - **Text group** — `<div>` containing:
     - `<h4>` — feature title, body font, semibold.
     - `<p>` — feature description, small size, secondary colour.
   - Layout: flex row, `gap: 1rem`, icon top-aligned (`align-items: flex-start`).

### Step 3 — Build the image column

Implement the **image column** as a `<div>` with `position: relative` containing:

1. **Image** — Use the existing `OptimizedImage` component (or a `<picture>` element with AVIF/WebP/fallback sources). Aspect ratio: `4:5` (portrait). Rounded corners, subtle shadow (`box-shadow: 6px 6px 40px rgba(26,23,20,0.08)`).
2. **Badge (optional)** — Render only when `props.badge` is provided. Positioned `absolute`, bottom-left corner (offset `-1.5rem` from edge). White background, padded, with subtle shadow. Contains:
   - `<div>` — large bold display value (`--font-serif`).
   - `<div>` — small uppercase label (`--tracking-wide`).
   - Hidden on mobile (`display: none` below `md` breakpoint).

### Step 4 — Compose the two-column grid layout

Wrap both columns in a CSS Grid container:

- `grid-template-columns: 1fr 1fr` on `lg` (≥ 1024px).
- Stacks to single column below `lg`.
- `gap: 4rem` (64px).
- `align-items: center`.

**Default layout** (`reversed={false}`): text column `order: 1`, image column `order: 2` on desktop. On mobile both stack (text first).

**Reversed layout** (`reversed={true}`): image column `order: 1`, text column `order: 2` on desktop. On mobile, text still comes first for content-priority reading order — use CSS `order` on the grid children at `lg` breakpoint only.

### Step 5 — Implement the background variant

The root `<section>` element receives a BEM modifier class based on `backgroundColor`:

| Prop value | CSS modifier class | Background token |
|------------|-------------------|-----------------|
| `'white'` (default) | `.feature-showcase--bg-white` | `--brand-bg-primary` (#FEFEFE) |
| `'beige'` | `.feature-showcase--bg-beige` | `--brand-bg-secondary` (#F6F5F0) |
| `'gray'` | `.feature-showcase--bg-gray` | `--brand-bd-color` (#E5E7DE) |

### Step 6 — Write styles (`FeatureShowcase.css`)

Use BEM class names. Reference design tokens from `tokens.css` / `style.css`.

```
.feature-showcase                              /* Block: root <section> */
.feature-showcase--reversed                    /* Modifier: image-left layout */
.feature-showcase--bg-white                    /* Modifier: white background */
.feature-showcase--bg-beige                    /* Modifier: beige background */
.feature-showcase--bg-gray                     /* Modifier: gray background */
.feature-showcase__container                   /* Element: max-width grid wrapper */
.feature-showcase__text-col                    /* Element: text column */
.feature-showcase__image-col                   /* Element: image column */
.feature-showcase__eyebrow                     /* Element: uppercase label */
.feature-showcase__title                       /* Element: h2 heading */
.feature-showcase__description                 /* Element: lead paragraph */
.feature-showcase__feature-list                /* Element: <ul> container */
.feature-showcase__feature-item                /* Element: <li> wrapper */
.feature-showcase__feature-icon                /* Element: icon container */
.feature-showcase__feature-icon--filled        /* Modifier: tinted box variant */
.feature-showcase__feature-icon--outlined      /* Modifier: bare icon variant */
.feature-showcase__feature-text                /* Element: title + description group */
.feature-showcase__feature-title               /* Element: <h4> feature heading */
.feature-showcase__feature-desc                /* Element: <p> feature body */
.feature-showcase__image-wrapper               /* Element: relative container for image + badge */
.feature-showcase__image                       /* Element: the <img> / <picture> */
.feature-showcase__badge                       /* Element: floating stat overlay */
.feature-showcase__badge-value                 /* Element: large number/text */
.feature-showcase__badge-label                 /* Element: small uppercase label */
```

Token mapping:

| Element | Font | Size | Weight | Colour | Notes |
|---------|------|------|--------|--------|-------|
| Eyebrow | `--font-sans` | `--text-tiny` (0.75rem) | 600 | `--brand-link` | `letter-spacing: 0.12em`, `text-transform: uppercase` |
| Title (h2) | `--font-serif` | `--text-heading-l` | 700 | `--brand-title` | `line-height: --lh-snug (1.375)` |
| Description | `--font-sans` | `--text-body-l` (1.125rem) | 400 | `--brand-slate` | `margin-bottom: 2.5rem` |
| Feature title | `--font-sans` | `--text-body` (1rem) | 600 | `--brand-title` | — |
| Feature desc | `--font-sans` | `--text-caption` (0.875rem) | 400 | `--brand-slate` | — |
| Badge value | `--font-serif` | `--text-heading-m` (1.5rem) | 700 | `--brand-title` | — |
| Badge label | `--font-sans` | `--text-tiny` (0.75rem) | 500 | `--brand-slate` | `text-transform: uppercase`, `letter-spacing: 0.12em` |

Section padding: `padding: 6rem 1.5rem` (desktop `8rem 1.5rem` at `md` breakpoint).
Container max-width: `1280px` (matching `max-w-screen-xl`).

### Step 7 — Write unit tests (`FeatureShowcase.test.tsx`)

Use Vitest + React Testing Library. Cover the following:

| # | Test case | Assertion |
|---|-----------|-----------|
| 1 | Renders eyebrow text | `screen.getByText('QUALITY & TRUST')` present |
| 2 | Renders title as h2 | `screen.getByRole('heading', { level: 2 })` contains expected text |
| 3 | Renders description paragraph | Description text is present in the document |
| 4 | Renders all feature items | Number of `.feature-showcase__feature-item` elements equals `features.length` |
| 5 | Each feature shows icon, title, and description | For each feature, all three parts render |
| 6 | Renders image with correct alt text | `screen.getByAltText('...')` is present |
| 7 | Badge renders when provided | `.feature-showcase__badge` exists, value and label text visible |
| 8 | Badge does not render when omitted | `.feature-showcase__badge` is absent |
| 9 | Default layout (not reversed) | Root element does **not** have `feature-showcase--reversed` class |
| 10 | Reversed layout | Root element **has** `feature-showcase--reversed` class |
| 11 | Background variant applies class | `backgroundColor="beige"` → root has `.feature-showcase--bg-beige` |
| 12 | Icon variant 'filled' | Icon containers have `.feature-showcase__feature-icon--filled` class |
| 13 | Icon variant 'outlined' | Icon containers have `.feature-showcase__feature-icon--outlined` class |
| 14 | Custom className is applied | Root `<section>` has the additional class |

### Step 8 — Export from package index

Add to `packages/ui/src/index.ts`:

```typescript
export {
  FeatureShowcase,
  type FeatureShowcaseProps,
  type FeatureShowcaseItem,
  type FeatureShowcaseBadge,
  type FeatureShowcaseBg,
} from './components/FeatureShowcase/FeatureShowcase';
```

---

## Rendering Contract

### Layout

- **Desktop (≥ 1024px)**: Two equal columns (`1fr 1fr`), `gap: 4rem`, vertically centred.
- **Tablet (768–1023px)**: Single column stack, text above image (regardless of `reversed`).
- **Mobile (< 768px)**: Single column stack, text above image.
- **Max-width**: `1280px`, centred.
- **Vertical padding**: `6rem` mobile, `8rem` desktop.

### Semantic HTML Structure

```html
<section
  class="feature-showcase feature-showcase--bg-white"
  aria-labelledby="feature-showcase-quality"
>
  <div class="feature-showcase__container">
    <!-- Text column -->
    <div class="feature-showcase__text-col">
      <span class="feature-showcase__eyebrow">QUALITY & TRUST</span>
      <h2 id="feature-showcase-quality" class="feature-showcase__title">
        Built to the Highest Standard
      </h2>
      <p class="feature-showcase__description">
        Our commitment to architectural integrity means we sweat the details...
      </p>
      <ul class="feature-showcase__feature-list" role="list">
        <li class="feature-showcase__feature-item">
          <div class="feature-showcase__feature-icon feature-showcase__feature-icon--filled">
            <span class="material-symbols-outlined" aria-hidden="true">thermostat</span>
          </div>
          <div class="feature-showcase__feature-text">
            <h4 class="feature-showcase__feature-title">Fully Insulated & A-Rated</h4>
            <p class="feature-showcase__feature-desc">Exceeding building regulations...</p>
          </div>
        </li>
        <!-- ... more items -->
      </ul>
    </div>

    <!-- Image column -->
    <div class="feature-showcase__image-col">
      <div class="feature-showcase__image-wrapper">
        <!-- OptimizedImage or <picture> -->
        <img
          class="feature-showcase__image"
          src="..."
          alt="Close up of modern architectural house extension exterior"
          loading="lazy"
        />
        <!-- Badge (optional) -->
        <div class="feature-showcase__badge">
          <div class="feature-showcase__badge-value">100%</div>
          <div class="feature-showcase__badge-label">STEEL FRAME</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Reversed variant

When `reversed={true}`, the HTML stays the same but the root element gains `feature-showcase--reversed`. CSS uses `order` to swap columns at the `lg` breakpoint:

```css
/* Default: text = order 1, image = order 2 */
.feature-showcase__text-col  { order: 2; }
.feature-showcase__image-col { order: 1; }

@media (min-width: 1024px) {
  .feature-showcase__text-col  { order: 1; }
  .feature-showcase__image-col { order: 2; }

  .feature-showcase--reversed .feature-showcase__text-col  { order: 2; }
  .feature-showcase--reversed .feature-showcase__image-col { order: 1; }
}
```

On mobile, text always comes first (higher content priority) regardless of `reversed`.

### Accessibility

- Root `<section>` uses `aria-labelledby` pointing to the `<h2>` id.
- Material Symbols icons use `aria-hidden="true"` (decorative — the adjacent title conveys meaning).
- Feature list uses `<ul role="list">` + `<li>` for assistive tech enumeration.
- Image has descriptive `alt` text. Uses `loading="lazy"` (below fold).
- Badge is visible text — no additional ARIA needed.
- Colour contrast: `--brand-slate` (#555555) on white (#FEFEFE) = 7.4:1 ✓ ; on beige (#F6F5F0) = 6.8:1 ✓ (both pass AA).
- `prefers-reduced-motion`: No animations in this component. The subtle shadow on the image is static.

### Two usage examples from the page

**Section 4 — Quality & Trust:**
```tsx
<FeatureShowcase
  eyebrow="QUALITY & TRUST"
  title="Built to the Highest Standard"
  description="Our commitment to architectural integrity..."
  features={QUALITY_FEATURES}
  imageSrc="/resource/house-extension/quality.png"
  imageWebP="/resource/house-extension/quality.webp"
  imageAvif="/resource/house-extension/quality.avif"
  imageAlt="Modern house extension with black timber cladding and sliding glass doors"
  badge={{ value: '100%', label: 'STEEL FRAME' }}
  backgroundColor="white"
  iconVariant="filled"
/>
```

**Section 5 — Transparent Pricing:**
```tsx
<FeatureShowcase
  eyebrow="TRANSPARENT PRICING"
  title={<>Competitive Pricing.<br />No Hidden Costs.</>}
  description="We believe in total transparency..."
  features={PRICING_FEATURES}
  imageSrc="/resource/house-extension/pricing.png"
  imageWebP="/resource/house-extension/pricing.webp"
  imageAvif="/resource/house-extension/pricing.avif"
  imageAlt="Bright interior of house extension with open plan kitchen flooded with natural light"
  reversed
  backgroundColor="beige"
  iconVariant="outlined"
/>
```
