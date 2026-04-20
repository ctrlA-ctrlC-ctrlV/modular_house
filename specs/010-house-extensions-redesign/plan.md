# Implementation Plan: House Extensions Page Redesign

**Branch**: `010-house-extensions-redesign` | **Date**: 2026-04-20 | **Template**: `.template/house-extensions/house-extensions-design.html`

---

## Summary

Redesign the `/house-extensions` page from its current 2-section layout (hero + masonry gallery) into a 9-section conversion-optimized page. Three new UI components will be created in `packages/ui`: **TextIntroSection** (centred prose intro), **FeatureShowcase** (two-column image + feature-list, reversible layout with configurable background), and **FooterCTA** (dark full-width call-to-action strip). The remaining 4 sections reuse existing components (`GoBespokeBanner`, `TestimonialGrid`, `InfiniteMasonryGallery`, `AccordionFAQ`). The hero section retains `HeroBoldBottomText` with updated copy. All page content will be extracted into a dedicated data file (`house-extension-data.ts`) following the established data-separation pattern.

---

## 1. Component Breakdown

### 1.1 Hero Section — `HeroBoldBottomText` (EXISTING)

| Field | Detail |
|-------|--------|
| **Purpose** | Full-viewport hero with bold heading, subtext, and primary CTA anchored to the bottom. |
| **Component** | `HeroBoldBottomText` from `@modular-house/ui` |
| **Status** | Reuse as-is; update props only. |
| **Props** | `titleLine1`: "Expand your living space with a seamless home extension." · `ctaText`: "Get a Free Quote" · `ctaLink`: "/contact" · `backgroundImage`: optimised local asset (AVIF/WebP/PNG chain) · `bigText`: "House Extension" · `renderLink` |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |
| **Reuse potential** | Already used on Garden Room and Landing pages. |

### 1.2 Text Intro Section — `TextIntroSection` (NEW)

| Field | Detail |
|-------|--------|
| **Purpose** | Centred editorial introduction with an eyebrow label, heading, one or more body paragraphs, and a decorative divider. Sets the narrative tone before feature sections. |
| **Props** | `eyebrow: string` — uppercase label (e.g. "WHY HOUSE EXTENSIONS") · `title: string` — section heading · `paragraphs: string[]` — array of body paragraphs · `className?: string` |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |
| **Reuse potential** | Any service or product page that needs a centred prose introduction (About, Materials, Process pages). |
| **Styling notes** | `max-w-3xl` centred container, eyebrow flanked by horizontal rules, `font-display` heading, `font-body` paragraphs with `text-lg leading-relaxed`, bottom divider (`w-12 h-px`). Background: `--brand-bg-primary` (`#FEFEFE`). |

### 1.3 Bespoke Callout — `GoBespokeBanner` (EXISTING)

| Field | Detail |
|-------|--------|
| **Purpose** | Two-column CTA banner encouraging users to start a bespoke project. |
| **Component** | `GoBespokeBanner` from `@modular-house/ui` |
| **Status** | Reuse as-is; supply house-extension-specific copy. |
| **Props** | `eyebrow`: "BESPOKE EXTENSIONS" · `heading`: `<>Every home is unique.<br />Your extension should be too.</>` · `subtext`: "We don't do off-the-shelf…" · `ctaLabel`: "Start Your Project" · `onCtaClick`: opens enquiry modal |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |
| **Reuse potential** | Already used on Garden Room page. |

### 1.4 Quality & Trust — `FeatureShowcase` (NEW)

| Field | Detail |
|-------|--------|
| **Purpose** | Two-column layout: one side has an eyebrow + heading + body text + a list of icon-led feature items; the other side has a hero-quality image with an optional floating stat badge. Designed to be the single component powering both section 4 (Quality & Trust) and section 5 (Transparent Pricing) with reversed layout and different backgrounds. |
| **Props** | See §1.4.1 below. |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |
| **Reuse potential** | Any page needing a persuasive feature/benefit section (About, Process, Materials). The mirrored layout + configurable background makes it highly versatile. |

#### 1.4.1 `FeatureShowcase` Props Interface

```typescript
export interface FeatureShowcaseItem {
  icon: string;           // Material Symbols icon name (e.g. "thermostat")
  title: string;          // Feature heading
  description: string;    // Feature body text
}

export interface FeatureShowcaseBadge {
  value: string;          // e.g. "100%"
  label: string;          // e.g. "STEEL FRAME"
}

export type FeatureShowcaseBg = 'white' | 'beige' | 'gray';

export interface FeatureShowcaseProps {
  eyebrow: string;                          // Uppercase label
  title: React.ReactNode;                   // Section heading (supports JSX)
  description: string;                      // Lead paragraph
  features: FeatureShowcaseItem[];          // Icon + title + description list
  imageSrc: string;                         // Image URL (fallback)
  imageWebP?: string;
  imageAvif?: string;
  imageAlt: string;
  badge?: FeatureShowcaseBadge;             // Optional floating stat overlay
  reversed?: boolean;                       // If true, image on left / text on right (default: false = text left, image right)
  backgroundColor?: FeatureShowcaseBg;      // Section background (default: 'white')
  iconVariant?: 'filled' | 'outlined';      // Icon container style: filled bg or plain icon (default: 'filled')
  className?: string;
}
```

### 1.5 Transparent Pricing — `FeatureShowcase` (REUSE of §1.4)

| Field | Detail |
|-------|--------|
| **Purpose** | Same component as Quality & Trust, rendered with `reversed={true}` and `backgroundColor="beige"`. Icon variant uses plain icons (no background box) matching the template. |
| **Props** | `eyebrow`: "TRANSPARENT PRICING" · `reversed`: `true` · `backgroundColor`: `"beige"` · `iconVariant`: `"outlined"` · features: Itemised Quotation, Fixed-Price Contracts, Milestone-Based Payments |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |

### 1.6 Testimonials — `TestimonialGrid` (EXISTING)

| Field | Detail |
|-------|--------|
| **Component** | `TestimonialGrid` from `@modular-house/ui` |
| **Status** | Reuse as-is. |
| **Props** | `subTitle`: "WHAT OUR CLIENTS SAY" · `title`: "Trusted by Homeowners Across Dublin" · `testimonials`: array of `TestimonialItem` |
| **Data source** | Hardcoded constants in `house-extension-data.ts` (can share with garden room testimonials or have extension-specific ones). |

### 1.7 Gallery — `InfiniteMasonryGallery` (EXISTING)

| Field | Detail |
|-------|--------|
| **Component** | `InfiniteMasonryGallery` from `@modular-house/ui` |
| **Status** | Reuse as-is. |
| **Props** | `images`: array of `InfiniteGalleryImage` using local optimised assets from `/resource/house-extension/` · `eyebrow`: "OUR WORK" · `title`: "House Extension Projects" |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |

### 1.8 FAQ — `AccordionFAQ` (EXISTING)

| Field | Detail |
|-------|--------|
| **Component** | `AccordionFAQ` from `@modular-house/ui` |
| **Status** | Reuse as-is. |
| **Props** | `title`: "Frequently Asked Questions" · `faqs`: array of `AccordionFAQItem` with house-extension-specific Q&A |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |

### 1.9 Footer CTA — `FooterCTA` (NEW)

| Field | Detail |
|-------|--------|
| **Purpose** | Full-width dark section with centred heading, subtext, and two action buttons (primary + secondary/ghost). Serves as the page's closing conversion point. |
| **Props** | See §1.9.1 below. |
| **Data source** | Hardcoded constants in `house-extension-data.ts` |
| **Reuse potential** | Every service page (Garden Room, About, Process, Materials) can use this as a page-closing CTA. |

#### 1.9.1 `FooterCTA` Props Interface

```typescript
export interface FooterCTAAction {
  label: string;                            // Button text
  href: string;                             // Target URL
  variant: 'primary' | 'ghost';            // Visual style
  onClick?: (e: React.MouseEvent) => void;
}

export interface FooterCTAProps {
  title: string;                            // Main heading
  subtitle: string;                         // Supporting text
  actions: FooterCTAAction[];               // 1–2 action buttons
  renderLink?: LinkRenderer;                // React Router bridge
  className?: string;
}
```

---

## 2. Component Hierarchy

```
HouseExtension (page route)
│
├── HeroBoldBottomText              ← §1.1 (existing)
│
├── TextIntroSection                ← §1.2 (NEW)
│
├── GoBespokeBanner                 ← §1.3 (existing)
│
├── FeatureShowcase                 ← §1.4 (NEW) — "Quality & Trust"
│   ├── OptimizedImage
│   └── FeatureShowcaseItem (×3)
│
├── FeatureShowcase                 ← §1.5 (same component, reversed)
│   ├── OptimizedImage              — "Transparent Pricing"
│   └── FeatureShowcaseItem (×3)
│
├── TestimonialGrid                 ← §1.6 (existing)
│   └── TestimonialCard (×n)
│
├── InfiniteMasonryGallery          ← §1.7 (existing)
│   └── GalleryColumn (×n)
│
├── AccordionFAQ                    ← §1.8 (existing)
│   └── AccordionFAQItem (×n)
│
└── FooterCTA                       ← §1.9 (NEW)
    └── FooterCTAAction (×2)
```

All sections are direct children of the page container (`<div className="house-extension-page">`). No nesting between sections — they stack vertically with their own padding/background.

---

## 3. Styling Approach

### 3.1 Design Token Alignment

| Section | Background Token | Text Tokens | Notes |
|---------|-----------------|-------------|-------|
| Hero | Dark overlay `rgba(0,0,0,0.4)` over image | `--brand-bg-primary` (white text) | Existing pattern from `HeroBoldBottomText` |
| Text Intro | `--brand-bg-primary` (`#FEFEFE`) | `--brand-title`, `--brand-slate` | New section; pure white bg |
| Bespoke Callout | Dark with diagonal texture | `--brand-bg-primary` text | Existing `GoBespokeBanner` styling |
| Quality & Trust | `--brand-bg-primary` (`#FEFEFE`) | `--brand-title`, `--brand-slate` | `backgroundColor="white"` |
| Transparent Pricing | `--brand-bg-secondary` (`#F6F5F0`) | `--brand-title`, `--brand-slate` | `backgroundColor="beige"` |
| Testimonials | Inherited from `TestimonialGrid` | Standard tokens | Existing component |
| Gallery | Inherited from `InfiniteMasonryGallery` | Standard tokens | Existing component |
| FAQ | Inherited from `AccordionFAQ` | Standard tokens | Existing component |
| Footer CTA | `--brand-bg-dark` (`#1A1714`) | White heading, muted subtext | New component |

### 3.2 Typography

| Element | Font | Token | Weight | Size |
|---------|------|-------|--------|------|
| Section eyebrows | Inter | `--font-sans` | 600 | `--text-tiny` (0.75rem) + `--tracking-wide` (0.12em) + uppercase |
| Section headings (h2) | Special Gothic / Newsreader | `--font-serif` | 700 | `--text-heading-l` (clamp 1.75–2.5rem) |
| Body text | Inter | `--font-sans` | 400 | `--text-body-l` (1.125rem) |
| Feature item titles | Inter | `--font-sans` | 600 | `--text-body` (1rem) |
| Feature item descriptions | Inter | `--font-sans` | 400 | `--text-caption` (0.875rem) |
| CTA button text | Inter | `--font-sans` | 600 | `--text-body` (1rem) |

> **Note**: The template uses `Newsreader` for display type. The project standard heading font is `Special Gothic Condensed One`. During implementation, use the project's `--font-serif` / `font-headline` class to maintain consistency with other pages. If the stakeholder preference is Newsreader specifically for this page, that should be raised as a design decision before build.

### 3.3 Spacing & Layout

- All sections: `py-24 md:py-32` vertical padding (6rem / 8rem), `px-6` base horizontal padding.
- Content containers: `max-w-screen-xl mx-auto` (1280px) for two-column sections; `max-w-3xl mx-auto` (768px) for centred prose.
- Two-column grid: `grid lg:grid-cols-2 gap-16` with `items-center`.
- Feature lists: `space-y-6` between items, `gap-4` between icon and text.
- Follows the project's responsive breakpoints: Desktop > 992px, Tablet 768–992px, Mobile < 768px.

### 3.4 CSS Architecture

New components follow the project's **BEM + CSS Modules** pattern:
- Each component gets its own `.css` file (e.g. `TextIntroSection.css`, `FeatureShowcase.css`, `FooterCTA.css`).
- Class names follow BEM: `.text-intro-section__eyebrow`, `.feature-showcase--reversed`, `.footer-cta__actions`.
- Design tokens referenced via CSS custom properties.
- Tailwind utility classes can be used for layout within components (consistent with existing codebase pattern), but core styling lives in BEM classes.

### 3.5 Motion & Interaction

| Interaction | Duration | Easing | Detail |
|-------------|----------|--------|--------|
| CTA button hover | 0.3s | ease | `bg-primary-container → bg-primary`, shadow lift |
| Ghost button hover | 0.3s | ease | `bg-transparent → bg-surface-container-highest/10` |
| Feature icon hover | 0.2s | ease | Subtle colour shift (optional) |
| `prefers-reduced-motion` | — | — | All transitions disabled per project standard |

---

## 4. Data Requirements

All content lives in `apps/web/src/data/house-extension-data.ts`. No CMS or API calls — static content hardcoded in TypeScript constants.

### 4.1 Data File Structure

```typescript
// apps/web/src/data/house-extension-data.ts

import type {
  TestimonialItem,
  InfiniteGalleryImage,
  AccordionFAQItem,
} from '@modular-house/ui';
import type {
  FeatureShowcaseItem,
  FeatureShowcaseBadge,
  FooterCTAAction,
} from '@modular-house/ui';

// §1.1 Hero
export const HERO_CONFIG = { ... };

// §1.2 Text Intro
export const TEXT_INTRO = {
  eyebrow: 'WHY HOUSE EXTENSIONS',
  title: 'Your Space. Your Vision.',
  paragraphs: [
    'Whether you are envisioning a light-filled open-plan kitchen...',
    'In Dublin, where architectural heritage meets modern living demands...',
  ],
};

// §1.3 Bespoke Banner
export const BESPOKE_BANNER = { ... };

// §1.4 Quality & Trust features
export const QUALITY_FEATURES: FeatureShowcaseItem[] = [
  { icon: 'thermostat', title: 'Fully Insulated & A-Rated', description: '...' },
  { icon: 'architecture', title: 'Planning Compliance Guaranteed', description: '...' },
  { icon: 'verified', title: '10-Year Structural Warranty', description: '...' },
];
export const QUALITY_BADGE: FeatureShowcaseBadge = { value: '100%', label: 'STEEL FRAME' };

// §1.5 Transparent Pricing features
export const PRICING_FEATURES: FeatureShowcaseItem[] = [
  { icon: 'receipt_long', title: 'Detailed Itemised Quotation', description: '...' },
  { icon: 'lock', title: 'Fixed-Price Contracts', description: '...' },
  { icon: 'flag', title: 'Milestone-Based Payments', description: '...' },
];

// §1.6 Testimonials
export const HOUSE_EXTENSION_TESTIMONIALS: TestimonialItem[] = [ ... ];

// §1.7 Gallery images
export const HOUSE_EXTENSION_GALLERY: InfiniteGalleryImage[] = [ ... ];

// §1.8 FAQ items
export const HOUSE_EXTENSION_FAQS: AccordionFAQItem[] = [ ... ];

// §1.9 Footer CTA
export const FOOTER_CTA_ACTIONS: FooterCTAAction[] = [
  { label: 'Get a Free Quote', href: '/contact', variant: 'primary' },
  { label: 'Call Us Today', href: 'tel:+353...', variant: 'ghost' },
];
```

### 4.2 Image Assets

| Section | Source | Format | Notes |
|---------|--------|--------|-------|
| Hero background | `/resource/house-extension/` or new asset | AVIF → WebP → JPEG | `priority` loading for LCP |
| Quality & Trust image | New asset needed | AVIF → WebP → PNG | Portrait 4:5 aspect ratio |
| Transparent Pricing image | New asset needed | AVIF → WebP → PNG | Portrait 4:5 aspect ratio |
| Gallery images | Existing `/resource/house-extension/` + new assets | AVIF → WebP → PNG/JPEG | Mixed orientation |
| Testimonial avatars | Placeholder or real photos | WebP/PNG | Square, small (<100px) |

---

## 5. Implementation Order

Dependencies flow top-down. Each phase can be PR'd independently.

### Phase 1: New Shared Components (`packages/ui`)

Build new components first since the page depends on them. Each component includes its `.tsx`, `.css`, and `.test.tsx` files.

| Step | Task | Depends On | Estimated Files |
|------|------|------------|-----------------|
| 1.1 | **TextIntroSection** — component + CSS + unit test | — | 3 new files |
| 1.2 | **FeatureShowcase** — component + CSS + unit test (covers both "Quality" and "Pricing" variants) | — | 3 new files |
| 1.3 | **FooterCTA** — component + CSS + unit test | — | 3 new files |
| 1.4 | **Export new components** from `packages/ui/src/index.ts` | 1.1, 1.2, 1.3 | 1 modified file |

> Steps 1.1–1.3 are independent and can be built in parallel.

### Phase 2: Page Data (`apps/web`)

| Step | Task | Depends On | Estimated Files |
|------|------|------------|-----------------|
| 2.1 | Create `apps/web/src/data/house-extension-data.ts` with all content constants, testimonials, FAQs, gallery images, feature lists | Phase 1 types exported | 1 new file |
| 2.2 | Source and optimise image assets (hero, feature section images) into `/public/resource/house-extension/` | — | ~6–10 image files |

### Phase 3: Page Assembly (`apps/web`)

| Step | Task | Depends On | Estimated Files |
|------|------|------------|-----------------|
| 3.1 | **Rewrite `HouseExtension.tsx`** — compose all 9 sections using existing + new components, import data from `house-extension-data.ts` | Phase 1, Phase 2 | 1 modified file |
| 3.2 | **Update `routes-metadata.ts`** — enhanced meta tags and structured data (WebPage, FAQPage, BreadcrumbList schemas) for SEO | 3.1 | 1 modified file |

### Phase 4: Quality Assurance

| Step | Task | Depends On |
|------|------|------------|
| 4.1 | Visual regression check — compare against HTML template at all 3 breakpoints (desktop, tablet, mobile) | 3.1 |
| 4.2 | Accessibility audit — keyboard navigation, screen reader, focus management, `prefers-reduced-motion` | 3.1 |
| 4.3 | Performance check — LCP < 2.5s, image optimisation, lazy loading below-fold images | 3.1 |
| 4.4 | SEO validation — structured data passes Google Rich Results validator | 3.2 |
| 4.5 | Cross-browser smoke test (Chrome, Firefox, Safari, Edge) | 3.1 |

---

## Project Structure

### Documentation (this feature)

```text
specs/010-house-extensions-redesign/
├── plan.md              # This file
```

### Source Code (new & modified files)

```text
packages/ui/src/components/
├── TextIntroSection/                    # NEW component
│   ├── TextIntroSection.tsx
│   ├── TextIntroSection.css
│   └── TextIntroSection.test.tsx
│
├── FeatureShowcase/                     # NEW component
│   ├── FeatureShowcase.tsx
│   ├── FeatureShowcase.css
│   └── FeatureShowcase.test.tsx
│
├── FooterCTA/                           # NEW component
│   ├── FooterCTA.tsx
│   ├── FooterCTA.css
│   └── FooterCTA.test.tsx
│
├── HeroBoldBottomText/                  # EXISTING (no changes)
├── GoBespokeBanner/                     # EXISTING (no changes)
├── TestimonialGrid/                     # EXISTING (no changes)
├── InfiniteMasonryGallery/              # EXISTING (no changes)
├── AccordionFAQ/                        # EXISTING (no changes)
└── OptimizedImage/                      # EXISTING (no changes)

packages/ui/src/index.ts                 # MODIFY: add exports for new components

apps/web/src/
├── data/
│   └── house-extension-data.ts          # NEW: all page content constants
├── routes/
│   └── HouseExtension.tsx               # REWRITE: 2 sections → 9 sections
└── routes-metadata.ts                   # MODIFY: enhanced SEO schemas
```

---

## Technical Context

| Field | Value |
|-------|-------|
| **Language/Version** | TypeScript 5.6, React 18.3 |
| **Primary Dependencies** | react-router-dom 6.28, react-helmet-async 2.0.5, Vite 6.0, @modular-house/ui |
| **Storage** | N/A (static content, no database) |
| **Testing** | Vitest (unit), manual visual testing for responsive layout |
| **Target Platform** | Web (SSG pre-rendered, modern browsers + iOS Safari) |
| **Project Type** | pnpm monorepo (`apps/web` + `packages/ui`) |
| **Performance Goals** | LCP < 2.5s on 4G; hero image eager-loaded; below-fold images lazy |
| **Constraints** | WCAG 2.1 AA; SEO structured data must pass Google Rich Results; visual consistency with Garden Room page |
| **Scale/Scope** | 1 page rewrite, 3 new components, ~4 modified files, ~10 new files |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Font mismatch (template uses Newsreader, project uses Special Gothic) | Visual deviation from mockup | Confirm font choice with design stakeholder before Phase 1 |
| Missing image assets for feature sections | Sections look incomplete | Phase 2.2 must be completed before Phase 3 merges |
| `FeatureShowcase` complexity (two layout variants + badge) | Over-engineering | Keep variants to `reversed` boolean + `backgroundColor` enum; avoid further configuration |
| Existing `InfiniteMasonryGallery` uses different image data shape than current `FullMassonryGallery` in `HouseExtension.tsx` | Migration effort | Map existing gallery data to `InfiniteGalleryImage[]` type during Phase 2.1 |
