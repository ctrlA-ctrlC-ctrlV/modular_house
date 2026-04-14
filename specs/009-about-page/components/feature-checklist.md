# FeatureChecklist

## 1. Purpose

A two-column layout pairing a supporting image with a vertically-stacked list of benefits. Each list item has an icon bullet, a bold title, and a short description. Used on the About page for "Why Steel Frame" and reusable for product benefit lists, process explainers, and comparison panels on any service page.

## 2. Source Files

- `packages/ui/src/components/FeatureChecklist/FeatureChecklist.tsx`
- `packages/ui/src/components/FeatureChecklist/FeatureChecklist.css`
- `packages/ui/src/components/FeatureChecklist/FeatureChecklist.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
export type FeatureChecklistBackground = 'primary' | 'secondary';

export interface ChecklistItem {
  /** Stable key for the item. */
  id: string;
  /** Icon displayed at the start of the row (e.g., check mark). */
  icon: React.ReactNode;
  /** Bold item title. */
  title: string;
  /** Supporting description text. */
  description: string;
}

export interface FeatureChecklistProps {
  /** Uppercase eyebrow label above the heading. */
  eyebrow: string;
  /** Section heading rendered as <h2>. */
  heading: string;
  /** Checklist benefit items. Expect 3–6 for balanced layout. */
  items: ChecklistItem[];
  /** Image source URL (fallback). */
  imageSrc: string;
  /** WebP variant URL. */
  imageWebP?: string;
  /** AVIF variant URL. */
  imageAvif?: string;
  /** Alt text for the image. Required for accessibility. */
  imageAlt: string;
  /** When true, image is placed in the left column. @default true */
  imageFirst?: boolean;
  /** Background variant. @default 'primary' */
  backgroundColor?: FeatureChecklistBackground;
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
}
```

## 4. DOM Structure

```
<section class="feature-checklist feature-checklist--bg-{primary|secondary} [feature-checklist--image-first]">
  <div class="feature-checklist__inner">
    <div class="feature-checklist__media">
      <OptimizedImage class="feature-checklist__image" .../>
    </div>
    <div class="feature-checklist__text">
      <span class="feature-checklist__eyebrow">{eyebrow}</span>
      <h2 class="feature-checklist__heading">{heading}</h2>
      <ul class="feature-checklist__list" role="list">
        <li class="feature-checklist__item" key={item.id}>
          <span class="feature-checklist__icon" aria-hidden="true">{item.icon}</span>
          <div class="feature-checklist__item-body">
            <span class="feature-checklist__item-title">{item.title}</span>
            <p class="feature-checklist__item-description">{item.description}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section padding (vertical) | `var(--spacing-4xl)` desktop, `var(--spacing-3xl)` mobile |
| Container max-width | `1320px` |
| Grid column gap | `var(--spacing-4xl)` (96px) desktop, `var(--spacing-2xl)` tablet |
| Image aspect-ratio | `var(--ratio-square)` (1/1) |
| Image border-radius | `4px` |
| Eyebrow pattern | identical to ContentWithImage |
| Heading font / color | `var(--font-serif)`, `var(--text-heading-l)`, `var(--brand-title)` |
| List item gap | `var(--spacing-lg)` (24px) between items |
| Icon-title gap | `var(--spacing-md)` (16px) |
| Icon color | `var(--brand-link)` |
| Icon size | `24px` |
| Item title font | `var(--font-sans)`, `var(--text-body)`, `var(--weight-semibold)` |
| Item title color | `var(--brand-title)` |
| Item description color | `var(--brand-slate)` |
| Item description line-height | `var(--lh-relaxed)` |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | Two columns, 50/50 split. Column order reflects `imageFirst`. |
| Tablet (768–992px) | Two columns with reduced gap. |
| Mobile (< 768px) | Single column. Image always rendered first on mobile, regardless of `imageFirst`. |

## 7. Interaction & Motion

- No hover states. Section is presentational.
- No transitions. Reduced-motion block is a future-proofing placeholder.

## 8. Accessibility Checklist

- `<section>` with `aria-labelledby` on heading.
- `<ul role="list">` used (Safari reset compatibility).
- Icon wrapped in `<span aria-hidden="true">` — the item title carries meaning.
- Heading hierarchy: `<h2>` section heading; list item titles are `<span>` (not headings) because they are short labels, not navigable sub-sections.
- `imageAlt` required. Use `""` with a JSDoc note only when the image is decorative.
- Aspect ratio on media container prevents CLS.

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/FeatureChecklist/` with empty `.tsx` and `.css`. Export from `packages/ui/src/index.ts`.
2. Define `ChecklistItem`, `FeatureChecklistBackground`, and `FeatureChecklistProps`. Export all three.
3. Build JSX with the BEM classes from section 4. Split list rendering into a co-located `ChecklistRow` internal component for readability.
4. Wire `OptimizedImage` into `.feature-checklist__media` with `loading="lazy"`.
5. Write desktop-first CSS using tokens from section 5. Implement `.feature-checklist--image-first` modifier via `grid-template-columns` and `order`.
6. Add tablet and mobile media queries. At mobile, force image to render first (use `order: -1` on the media column or re-order via flex direction).
7. Add `@media (prefers-reduced-motion: reduce)` placeholder block.
8. Create `FeatureChecklist.stories.tsx` with two stories: default (`imageFirst={true}`) and `imageFirst={false}` on secondary background.

## 10. Done Criteria

- Types compile, no `any`.
- Storybook renders both stories.
- At mobile width image appears above the text regardless of `imageFirst`.
- Icons render in brand copper color.
- No raw hex values in CSS.
