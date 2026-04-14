# Implementation Plan: About Page

**Branch**: `009-about-page` | **Date**: 2026-04-13 | **Template**: `.template/about/about_stitch.html`

## Summary

Rebuild the `/about` page from its current placeholder implementation (CMS-driven text block) into a 7-section, component-driven page matching the approved UX template. The page introduces Modular House's story, values, steel-frame expertise, team, and key performance stats, culminating in a conversion-focused CTA.

Four new reusable components will be created in `packages/ui`:

1. **ContentWithImage** -- Two-column story section (text + portrait image); reversible column order.
2. **ValueCardGrid** -- Icon-led card grid for mission/values/features.
3. **FeatureChecklist** -- Image + checklist of benefits with icon bullets.
4. **TeamGrid** -- Circular avatar grid for team members.

Two existing components will be reused directly:

- **StatsBar** -- A new lightweight component for the stats counters.
- **GradientCTA** -- A new CTA banner using the brand signature gradient.

The existing `HeroBoldBottomText` hero component will be reused for the hero section.

---

## Component Specifications

Each new component has a dedicated specification document under [`components/`](./components/README.md) covering its prop contract, DOM structure, design-token mapping, responsive behaviour, accessibility rules, and a numbered task breakdown. Implementers should treat these as the authoritative build instructions for each component.

| Component | Specification |
|-----------|---------------|
| ContentWithImage | [components/content-with-image.md](./components/content-with-image.md) |
| ValueCardGrid    | [components/value-card-grid.md](./components/value-card-grid.md) |
| FeatureChecklist | [components/feature-checklist.md](./components/feature-checklist.md) |
| TeamGrid         | [components/team-grid.md](./components/team-grid.md) |
| StatsBar         | [components/stats-bar.md](./components/stats-bar.md) |
| GradientCTA      | [components/gradient-cta.md](./components/gradient-cta.md) |

---

## 1. Component Breakdown

### 1.1 Hero Section (existing: `HeroBoldBottomText`)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 1 -- full-viewport hero image with overlay and bold heading |
| **Purpose** | Sets the editorial tone; introduces the About page with a compelling background image and headline |
| **Props used** | `titleLine1`, `titleLine2`, `backgroundImage`, `backgroundImageWebP`, `backgroundImageAvif` |
| **Reuse** | Already used on Garden Room and Landing pages |
| **Notes** | No CTA button needed on About hero (set `ctaText` to empty/omit). Subheadline text ("Crafting premium steel-frame...") rendered via `titleLine2` prop. |

### 1.2 ContentWithImage (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 2 -- "Our Story" |
| **Purpose** | Versatile two-column layout pairing editorial narrative text with a supporting image. Distinct from `TwoColumnSplitLayout` in that it focuses on long-form prose (multiple `<p>` tags) rather than feature bullet points and dual images. |
| **File** | `packages/ui/src/components/ContentWithImage/ContentWithImage.tsx` |

**Props (interface `ContentWithImageProps`)**:

```typescript
interface ContentWithImageProps {
  /** Uppercase eyebrow label above the heading */
  eyebrow: string;
  /** Section heading */
  heading: string;
  /** Body content -- accepts ReactNode for multi-paragraph prose */
  children: React.ReactNode;
  /** Image source URL */
  imageSrc: string;
  /** WebP variant for optimized loading */
  imageWebP?: string;
  /** AVIF variant for optimized loading */
  imageAvif?: string;
  /** Image alt text (required for accessibility) */
  imageAlt: string;
  /** Aspect ratio class for the image container */
  imageAspectRatio?: '1:1' | '4:5' | '3:4' | '16:9';
  /** Whether to place the image on the left (true) or right (false) */
  imageFirst?: boolean;
  /** Optional background variant */
  backgroundColor?: 'primary' | 'secondary';
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: Company story sections on any future marketing page (e.g., Careers, Partnerships), product detail pages with editorial intros, blog post layouts.

### 1.3 ValueCardGrid (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 3 -- "Mission & Values" |
| **Purpose** | Displays a centered section header (eyebrow + heading) above a responsive grid of icon-led content cards |
| **File** | `packages/ui/src/components/ValueCardGrid/ValueCardGrid.tsx` |

**Props (interface `ValueCardGridProps`)**:

```typescript
interface ValueCardItem {
  /** Icon rendered above the card title. Accepts ReactNode for SVG or Material icon. */
  icon: React.ReactNode;
  /** Card heading */
  title: string;
  /** Card body text */
  description: string;
}

interface ValueCardGridProps {
  /** Uppercase eyebrow label */
  eyebrow: string;
  /** Section heading */
  heading: string;
  /** Array of value/mission cards */
  items: ValueCardItem[];
  /** Background color variant */
  backgroundColor?: 'primary' | 'secondary';
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: "Why Choose Us" sections on service pages, feature highlights on product pages, benefit grids on landing pages.

### 1.4 FeatureChecklist (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 4 -- "Why Steel Frame" |
| **Purpose** | Two-column layout with a square image on one side and a checklist of benefits on the other. Each checklist item has an icon, bold title, and description. |
| **File** | `packages/ui/src/components/FeatureChecklist/FeatureChecklist.tsx` |

**Props (interface `FeatureChecklistProps`)**:

```typescript
interface ChecklistItem {
  /** Icon shown beside the item (e.g., checkmark). Accepts ReactNode. */
  icon: React.ReactNode;
  /** Bold item title */
  title: string;
  /** Supporting description text */
  description: string;
}

interface FeatureChecklistProps {
  /** Uppercase eyebrow label */
  eyebrow: string;
  /** Section heading */
  heading: string;
  /** Checklist benefit items */
  items: ChecklistItem[];
  /** Image source URL */
  imageSrc: string;
  /** WebP variant */
  imageWebP?: string;
  /** AVIF variant */
  imageAvif?: string;
  /** Image alt text */
  imageAlt: string;
  /** Place the image on the left (true) or right (false) */
  imageFirst?: boolean;
  /** Background color variant */
  backgroundColor?: 'primary' | 'secondary';
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: "Why Steel Frame" on Garden Room/House Extension pages, "Our Process" benefit lists, comparison sections on any product page.

### 1.5 TeamGrid (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 5 -- "Our Team" |
| **Purpose** | Dark-background section displaying team members in a responsive grid with circular avatar photos, name, role, and short bio |
| **File** | `packages/ui/src/components/TeamGrid/TeamGrid.tsx` |

**Props (interface `TeamGridProps`)**:

```typescript
interface TeamMember {
  /** Team member's full name */
  name: string;
  /** Job title / role */
  role: string;
  /** Short biography */
  bio: string;
  /** Avatar image source */
  imageSrc: string;
  /** WebP variant */
  imageWebP?: string;
  /** AVIF variant */
  imageAvif?: string;
  /** Image alt text */
  imageAlt: string;
}

interface TeamGridProps {
  /** Uppercase eyebrow label */
  eyebrow: string;
  /** Section heading */
  heading: string;
  /** Array of team members */
  members: TeamMember[];
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: Leadership pages, partner/advisor grids, contributor credits on open-source or community pages.

### 1.6 StatsBar (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 6 -- Stats counters |
| **Purpose** | A horizontal bar of key metrics / statistics displayed as large numerals with captions |
| **File** | `packages/ui/src/components/StatsBar/StatsBar.tsx` |

**Props (interface `StatsBarProps`)**:

```typescript
interface StatItem {
  /** The stat value displayed prominently (e.g., "50+", "100%", "A1") */
  value: string;
  /** Caption text below the value */
  label: string;
}

interface StatsBarProps {
  /** Array of statistics to display */
  stats: StatItem[];
  /** Background color variant */
  backgroundColor?: 'primary' | 'secondary';
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: Company credentials sections, project summary dashboards, service pages, landing page trust indicators.

### 1.7 GradientCTA (NEW)

| Attribute | Detail |
|-----------|--------|
| **Template section** | Section 7 -- "Ready to Start Your Project?" CTA |
| **Purpose** | Full-width CTA section using the brand signature gradient (`--gradient-orange-brown`) with centered heading, subtext, and a prominent white button |
| **File** | `packages/ui/src/components/GradientCTA/GradientCTA.tsx` |

**Props (interface `GradientCTAProps`)**:

```typescript
interface GradientCTAProps {
  /** Primary heading */
  heading: string;
  /** Supporting subtext */
  subtext: string;
  /** CTA button label */
  ctaLabel: string;
  /** Click handler for the CTA button */
  onCtaClick: () => void;
  /** Optional href for the CTA (renders as <a> instead of <button>) */
  ctaHref?: string;
  /** Optional link renderer for router integration */
  linkRenderer?: LinkRenderer;
  /** Accessible label for the section */
  ariaLabel?: string;
  /** Optional className for extension */
  className?: string;
}
```

**Reuse beyond About page**: Bottom-of-page CTA on every marketing page (Garden Room, House Extension, Contact), newsletter signup prompt, seasonal promotion banners.

---

## 2. Component Hierarchy

```
<TemplateLayout>                        (existing -- injects Header, Footer, SEO)
  <main>
    <!-- Section 1: Hero -->
    <HeroBoldBottomText                  (existing packages/ui component)
      titleLine1="About Modular House"
      titleLine2="Crafting premium steel-frame garden rooms..."
      backgroundImage={heroImage}
    />

    <!-- Section 2: Our Story -->
    <ContentWithImage                    (NEW)
      eyebrow="Our Story"
      heading="Reimagining Living Spaces"
      imageSrc={storyImage}
      imageAlt="Steel frame assembly"
      imageAspectRatio="4:5"
      imageFirst={false}
    >
      <p>Founded in Dublin in 2020...</p>
      <p>Our journey began with a single garden studio...</p>
    </ContentWithImage>

    <!-- Section 3: Mission & Values -->
    <ValueCardGrid                       (NEW)
      eyebrow="What Drives Us"
      heading="Built on Quality, Delivered with Care"
      backgroundColor="secondary"
      items={valuesData}
    />

    <!-- Section 4: Why Steel Frame -->
    <FeatureChecklist                    (NEW)
      eyebrow="Why Steel Frame"
      heading="The Future of Rapid Construction"
      imageSrc={steelFrameImage}
      imageAlt="Steel frame structural detail"
      imageFirst={true}
      items={steelFrameBenefits}
    />

    <!-- Section 5: Our Team -->
    <TeamGrid                            (NEW)
      eyebrow="Our Team"
      heading="The People Behind Every Build"
      members={teamMembers}
    />

    <!-- Section 6: Stats -->
    <StatsBar                            (NEW)
      backgroundColor="secondary"
      stats={companyStats}
    />

    <!-- Section 7: CTA -->
    <GradientCTA                         (NEW)
      heading="Ready to Start Your Project?"
      subtext="Transform your property with a bespoke modular solution."
      ctaLabel="Get a Free Quote"
      onCtaClick={handleEnquiry}
    />
  </main>
</TemplateLayout>
```

---

## 3. Styling Approach

All new components follow the project's established patterns:

### 3.1 Methodology

- **BEM naming**: Each component uses its own `.css` file with Block-Element-Modifier class names (e.g., `.content-with-image`, `.content-with-image__eyebrow`, `.content-with-image--image-first`).
- **No Tailwind**: The project uses CSS custom properties with BEM, not utility-first CSS. The HTML template uses Tailwind for prototyping only; production components translate Tailwind classes into BEM CSS.

### 3.2 Token Mapping

| Template Pattern | Design Token |
|-----------------|-------------|
| `bg-surface` / white backgrounds | `--brand-bg-primary` (`#FEFEFE`) |
| `bg-surface-container-low` / beige backgrounds | `--brand-bg-secondary` (`#F6F5F0`) |
| `bg-[#1A1714]` / dark team section | `--brand-bg-dark` (`#1A1714`) |
| `text-primary` / copper accent | `--brand-link` (`#B55329`) |
| `text-on-surface` / headings | `--brand-title` (`#121414`) |
| `text-on-surface-variant` / body text | `--brand-slate` (`#555555`) |
| `font-gothic` / Special Gothic Condensed | `--font-serif` |
| `font-['Inter']` / body font | `--font-sans` |
| `text-6xl md:text-8xl` hero heading | `--text-display` (clamp-based fluid) |
| `text-4xl md:text-5xl` section heading | `--text-heading-l` (clamp-based fluid) |
| `text-xs uppercase tracking-[0.12em]` eyebrow | `--text-tiny` + `--tracking-wide` + `text-transform: uppercase` + `--weight-medium` |
| `signature-gradient` | `--gradient-orange-brown` |
| `hover:shadow-2xl` card hover | `--shadow-natural` with transition `0.35s cubic-bezier(0.25,0.46,0.45,0.94)` |
| `rounded-lg` | `border-radius: 4px` (design token default) |
| `max-w-7xl` containers | `max-width: 1320px` (section container token) |
| `py-32` section padding | `padding: var(--spacing-4xl) 0` (96px) |
| `gap-12` grid gaps | `gap: var(--spacing-2xl)` (48px) |

### 3.3 Responsive Strategy

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (> 992px) | 2-column splits, 3-column value cards, 4-column team grid, 4-column stats |
| Tablet (768-992px) | 2-column splits, 2-column value cards, 2-column team grid, 2-column stats |
| Mobile (< 768px) | Single-column stacking, centered text/avatars, 2-column stats |

### 3.4 Motion

- Card hover: `transform: scale(1.015)` + `box-shadow` transition at `0.35s` with custom cubic-bezier
- Team avatar: `filter: grayscale(1)` default, `grayscale(0)` on hover at `0.3s ease`
- CTA button: `transform: scale(1.05)` on hover at `0.2s ease`
- All transitions honor `@media (prefers-reduced-motion: reduce)` override

### 3.5 Accessibility

- Semantic HTML: `<header>` for hero, `<section>` with `aria-label` for each content block
- Heading hierarchy: single `<h1>` in hero, `<h2>` for section headings, `<h3>` for card titles
- All images use `alt` text via `OptimizedImage` component
- Focus-visible ring: `2px solid #4f46e5`, offset `2px`
- Color contrast: all text-on-background combinations meet WCAG AA (verified in design-tokens doc)
- Team member avatars: decorative grayscale filter does not affect content comprehension

---

## 4. Data Requirements

| Component | Data | Source | Rationale |
|-----------|------|--------|-----------|
| HeroBoldBottomText | Hero image path, title lines | Hardcoded in page data file | Static brand page; content changes infrequently. Image imported from `src/assets/` for vite-imagetools optimization. |
| ContentWithImage | Eyebrow, heading, body paragraphs, image | Hardcoded in page data file | Our Story narrative is brand copy, not CMS-managed. |
| ValueCardGrid | Eyebrow, heading, card items (icon, title, description) | Hardcoded in page data file | Mission/values are core brand statements. Icons from Material Symbols or CustomIcons. |
| FeatureChecklist | Eyebrow, heading, checklist items, image | Hardcoded in page data file | Steel-frame benefits are technical facts, rarely change. |
| TeamGrid | Eyebrow, heading, team members (name, role, bio, avatar) | Hardcoded in page data file | Small team (<10 people). When headcount grows, consider migrating to CMS. |
| StatsBar | Stat items (value, label) | Hardcoded in page data file | Key metrics updated quarterly at most. |
| GradientCTA | Heading, subtext, button label | Hardcoded in page data file | Standard conversion CTA. |

**Data file location**: `apps/web/src/data/about-data.ts`

This follows the same pattern as `apps/web/src/data/garden-room-data.ts` -- a single TypeScript file exporting named constants with full type safety.

---

## 5. Implementation Order

The build sequence is dependency-driven: foundational, reusable primitives first, then composed sections, then page assembly.

### Phase 1: Shared UI Components (packages/ui)

Build order within this phase reflects internal dependencies:

| Step | Component | Spec | Depends On | Estimated Effort |
|------|-----------|------|------------|-----------------|
| 1.1 | **ContentWithImage** | [spec](./components/content-with-image.md) | `OptimizedImage` (existing) | Small -- straightforward 2-col layout |
| 1.2 | **ValueCardGrid** | [spec](./components/value-card-grid.md) | None | Small -- grid + card pattern |
| 1.3 | **FeatureChecklist** | [spec](./components/feature-checklist.md) | `OptimizedImage` (existing) | Small -- 2-col layout + list |
| 1.4 | **TeamGrid** | [spec](./components/team-grid.md) | `OptimizedImage` (existing) | Medium -- circular avatars, dark theme, grayscale effect |
| 1.5 | **StatsBar** | [spec](./components/stats-bar.md) | None | Small -- simple stat grid |
| 1.6 | **GradientCTA** | [spec](./components/gradient-cta.md) | None | Small -- gradient bg + button |

Steps 1.1-1.3 can be parallelized. Steps 1.4-1.6 can be parallelized. Each component includes:
- `.tsx` implementation with strict TypeScript interfaces
- `.css` file using BEM methodology and design tokens
- Export added to `packages/ui/src/index.ts`

### Phase 2: Page Data

| Step | Task | Depends On |
|------|------|------------|
| 2.1 | Create `apps/web/src/data/about-data.ts` with all section content constants | Phase 1 type exports |

### Phase 3: Page Assembly

| Step | Task | Depends On |
|------|------|------------|
| 3.1 | Rewrite `apps/web/src/routes/About.tsx` to compose all 7 sections | Phase 1 + Phase 2 |
| 3.2 | Create `apps/web/src/routes/About.css` for page-level overrides (if any) | Phase 3.1 |
| 3.3 | Update `apps/web/src/routes-metadata.ts` with About page SEO config (OG, canonical, WebPage + BreadcrumbList schemas) | Phase 3.1 |

### Phase 4: Image Optimization

| Step | Task | Depends On |
|------|------|------------|
| 4.1 | Source/add hero image and section images to `apps/web/src/assets/about/` | None (can start in parallel) |
| 4.2 | Run `pnpm --filter @modular-house/web optimise:images` if any images placed in `public/` | Phase 4.1 |

### Phase 5: Testing & QA

| Step | Task | Depends On |
|------|------|------------|
| 5.1 | Visual regression testing across Desktop / Tablet / Mobile breakpoints | Phase 3 |
| 5.2 | Accessibility audit: keyboard navigation, screen reader, focus indicators | Phase 3 |
| 5.3 | Lighthouse performance check (LCP < 2.5s target) | Phase 4 |
| 5.4 | SEO validation: structured data via Google Rich Results Test | Phase 3.3 |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-about-page/
├── plan.md              # This file
```

### Source Code (repository root)

```text
packages/ui/src/components/
├── ContentWithImage/                    # NEW component
│   ├── ContentWithImage.tsx
│   └── ContentWithImage.css
│
├── ValueCardGrid/                       # NEW component
│   ├── ValueCardGrid.tsx
│   └── ValueCardGrid.css
│
├── FeatureChecklist/                    # NEW component
│   ├── FeatureChecklist.tsx
│   └── FeatureChecklist.css
│
├── TeamGrid/                            # NEW component
│   ├── TeamGrid.tsx
│   └── TeamGrid.css
│
├── StatsBar/                            # NEW component
│   ├── StatsBar.tsx
│   └── StatsBar.css
│
├── GradientCTA/                         # NEW component
│   ├── GradientCTA.tsx
│   └── GradientCTA.css
│
├── HeroBoldBottomText/                  # EXISTING (no changes)
└── OptimizedImage/                      # EXISTING (no changes)

packages/ui/src/index.ts                 # UPDATE: add exports for 6 new components

apps/web/src/
├── data/
│   └── about-data.ts                    # NEW: all About page content constants
├── routes/
│   ├── About.tsx                        # REWRITE: placeholder → 7-section page
│   └── About.css                        # NEW: page-level styles (if needed)
├── routes-metadata.ts                   # UPDATE: About page SEO config
└── assets/
    └── about/                           # NEW: optimized images for About page
        ├── hero.jpg
        ├── story.jpg
        └── steel-frame.jpg
```

---

## Technical Context

| Property | Value |
|----------|-------|
| Language/Version | TypeScript 5.6, React 18.3 |
| Primary Dependencies | react-router-dom 6.28, react-helmet-async 2.0.5, Vite 6.0, @modular-house/ui |
| Storage | N/A (static content, no database) |
| Testing | Vitest (unit), manual visual testing for responsive layout |
| Target Platform | Web (SSG pre-rendered, all modern browsers + iOS Safari) |
| Project Type | pnpm monorepo (apps/web + packages/ui) |
| Performance Goals | LCP < 2.5s on 4G; hero image eager-loaded; below-fold images lazy-loaded |
| Constraints | WCAG 2.1 AA; BEM CSS methodology; no Tailwind in production components |
| Scale/Scope | 1 page rewrite, 6 new components, ~3 files modified, ~15 files created |

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security & Privacy First | PASS | No user data handling. CTA links to existing contact form. No new attack surface. |
| II. Reliability & Observability | PASS | Frontend-only, static content. No new services or endpoints. |
| III. Test Discipline | PASS | Components testable in isolation. Visual QA across breakpoints. |
| IV. Performance & Efficiency | PASS | OptimizedImage for AVIF/WebP chain. Hero eager-loaded. Below-fold lazy. LCP budget < 2.5s. |
| V. Accessibility & Inclusive UX | PASS | Semantic HTML, heading hierarchy, focus indicators, reduced-motion support, alt text on all images. |

No violations. All gates pass.
