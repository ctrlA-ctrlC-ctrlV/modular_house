# ValueCardGrid

## 1. Purpose

A centered section containing an eyebrow label, a section heading, and a responsive grid of icon-led cards. Each card presents a single brand value or mission pillar with an icon, title, and short description. Used on the About page for "Mission & Values" and reusable for "Why Choose Us", benefit grids, and feature highlight sections on any marketing page.

## 2. Source Files

- `packages/ui/src/components/ValueCardGrid/ValueCardGrid.tsx`
- `packages/ui/src/components/ValueCardGrid/ValueCardGrid.css`
- `packages/ui/src/components/ValueCardGrid/ValueCardGrid.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
export type ValueCardGridBackground = 'primary' | 'secondary';

export interface ValueCardItem {
  /** Stable key for the item. */
  id: string;
  /** Icon displayed above the card title. ReactNode allows SVG or icon components. */
  icon: React.ReactNode;
  /** Card heading rendered as <h3>. */
  title: string;
  /** Card body description. */
  description: string;
}

export interface ValueCardGridProps {
  /** Uppercase eyebrow label above the heading. */
  eyebrow: string;
  /** Section heading rendered as <h2>. */
  heading: string;
  /** Array of value cards. Component expects 2–6 items. */
  items: ValueCardItem[];
  /** Background variant. @default 'secondary' */
  backgroundColor?: ValueCardGridBackground;
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
}
```

## 4. DOM Structure

```
<section class="value-card-grid value-card-grid--bg-{primary|secondary}">
  <div class="value-card-grid__inner">
    <header class="value-card-grid__header">
      <span class="value-card-grid__eyebrow">{eyebrow}</span>
      <h2 class="value-card-grid__heading">{heading}</h2>
    </header>
    <ul class="value-card-grid__list" role="list">
      <li class="value-card-grid__item" key={item.id}>
        <article class="value-card">
          <div class="value-card__icon" aria-hidden="true">{item.icon}</div>
          <h3 class="value-card__title">{item.title}</h3>
          <p class="value-card__description">{item.description}</p>
        </article>
      </li>
    </ul>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section padding (vertical) | `var(--spacing-4xl)` desktop, `var(--spacing-3xl)` mobile |
| Container max-width | `1320px` |
| Header bottom margin | `var(--spacing-4xl)` |
| Card padding | `var(--spacing-2xl)` (48px) |
| Card border-radius | `4px` |
| Card background | `var(--brand-bg-primary)` |
| Card shadow (resting) | `none` |
| Card shadow (hover) | `var(--shadow-natural)` |
| Icon size | `48px` (square wrapper) |
| Icon color | `var(--brand-link)` |
| Eyebrow font/color | see ContentWithImage — identical eyebrow pattern |
| Heading font | `var(--font-serif)`, `var(--text-heading-l)`, `var(--lh-tight)` |
| Heading color | `var(--brand-title)` |
| Card title font | `var(--font-serif)`, `var(--text-heading-m)` |
| Card title color | `var(--brand-title)` |
| Card description color | `var(--brand-slate)` |
| Card description line-height | `var(--lh-relaxed)` |
| Card grid gap | `var(--spacing-2xl)` |
| Background (primary) | `var(--brand-bg-primary)` |
| Background (secondary) | `var(--brand-bg-secondary)` |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | 3-column grid, left-aligned card text (centered header block). |
| Tablet (768–992px) | 2-column grid. |
| Mobile (< 768px) | Single column; card padding reduced to `var(--spacing-xl)`. |

## 7. Interaction & Motion

- Card hover: `box-shadow` from `none` to `var(--shadow-natural)`, transition `0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)`.
- Card hover: no transform (template uses shadow only).
- `@media (prefers-reduced-motion: reduce)` disables the shadow transition (shadow still applies on hover, but without animation).

## 8. Accessibility Checklist

- `<section>` with `aria-labelledby` on the heading.
- `<ul role="list">` explicitly set because some CSS resets strip the implicit list role in Safari.
- Icon wrapper has `aria-hidden="true"` — icons are decorative; the card title conveys meaning.
- Heading hierarchy: `<h2>` for the section heading, `<h3>` for each card title.
- Icons must render as inline SVG or font with `currentColor` so they inherit `var(--brand-link)`.
- Minimum contrast: card title on white `#121414 / #FEFEFE` ≈ 17:1 (AAA); description `#555555 / #FEFEFE` ≈ 7.5:1 (AAA).

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/ValueCardGrid/` with empty `.tsx` and `.css`. Add a named export to `packages/ui/src/index.ts`.
2. Define `ValueCardItem`, `ValueCardGridBackground`, and `ValueCardGridProps`. Export all three.
3. Build JSX: outer `<section>`, centered header block, and `<ul role="list">` of card items. Use BEM classes from section 4.
4. Extract the card as a co-located internal component `ValueCard` (not exported) to keep the render function readable. Ensure icon wrapper gets `aria-hidden="true"`.
5. Write `ValueCardGrid.css` with desktop-first base styles using tokens from section 5.
6. Add tablet and mobile media queries per section 6.
7. Add the card hover shadow transition and wrap it in a `@media (prefers-reduced-motion: reduce)` override.
8. Create `ValueCardGrid.stories.tsx` with two stories: default (3 items on primary background) and 4-items-on-secondary.

## 10. Done Criteria

- Types compile, no `any`.
- Storybook renders both stories.
- Grid reflows correctly at 1440 / 900 / 375 widths.
- Keyboard tab order enters the section once and moves on (cards are not focusable — they're not interactive).
- Hover shadow transition stops animating when `prefers-reduced-motion` is active.
