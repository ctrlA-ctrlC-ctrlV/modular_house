# StatsBar

## 1. Purpose

A horizontal bar of key metrics presented as large numerals with captions. Designed to provide quick, scannable trust indicators (projects completed, years of experience, ratings). Used on the About page after the team section and reusable on Landing, Garden Room, House Extension, or any other marketing page for credentials display.

## 2. Source Files

- `packages/ui/src/components/StatsBar/StatsBar.tsx`
- `packages/ui/src/components/StatsBar/StatsBar.css`
- `packages/ui/src/components/StatsBar/StatsBar.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
export type StatsBarBackground = 'primary' | 'secondary';

export interface StatItem {
  /** Stable key. */
  id: string;
  /** The stat value as displayed (e.g., "50+", "100%", "A1"). */
  value: string;
  /** Caption displayed below the value. */
  label: string;
}

export interface StatsBarProps {
  /** Array of stats. Component expects exactly 4 items for balanced layout. */
  stats: StatItem[];
  /** Background variant. @default 'secondary' */
  backgroundColor?: StatsBarBackground;
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
  /** Optional accessible label for the section. @default 'Company statistics' */
  ariaLabel?: string;
}
```

## 4. DOM Structure

```
<section class="stats-bar stats-bar--bg-{primary|secondary}" aria-label={ariaLabel}>
  <div class="stats-bar__inner">
    <ul class="stats-bar__list" role="list">
      <li class="stats-bar__item" key={stat.id}>
        <span class="stats-bar__value">{stat.value}</span>
        <span class="stats-bar__label">{stat.label}</span>
      </li>
    </ul>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section padding (vertical) | `var(--spacing-3xl)` (64px) |
| Container max-width | `1320px` |
| Background (primary) | `var(--brand-bg-primary)` |
| Background (secondary) | `var(--brand-bg-secondary)` |
| Value font | `var(--font-serif)` |
| Value size | `clamp(2.5rem, 5vw, 4rem)` (fluid display size tuned for stat numerals) |
| Value color | `var(--brand-link)` |
| Value line-height | `var(--lh-none)` |
| Label font | `var(--font-sans)`, `var(--text-tiny)`, `var(--weight-semibold)`, `var(--tracking-wide)`, uppercase |
| Label color | `var(--brand-slate)` |
| Value-label gap | `var(--spacing-sm)` (8px) |
| Grid column gap | `var(--spacing-2xl)` (48px) |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | 4 columns, centered text. |
| Tablet (768–992px) | 4 columns or 2 columns depending on content — default 4. |
| Mobile (< 768px) | 2 columns, centered. |

## 7. Interaction & Motion

- No hover states. Section is presentational.
- No intrinsic motion — counter-animation intentionally omitted (out of scope; could be added later via an opt-in prop without breaking the Open-Closed Principle).
- `@media (prefers-reduced-motion: reduce)` placeholder block included.

## 8. Accessibility Checklist

- `<section>` with `aria-label` (no heading by design — this is a bar, not a section with title).
- `<ul role="list">` for screen-reader clarity.
- Value and label are inside the same `<li>` so AT reads them together, for example "50 plus, projects completed".
- If the value contains non-speech characters (e.g., "+"), JSDoc should advise consumers to pass plain-text-friendly strings.
- Contrast: copper value on `var(--brand-bg-secondary)` meets AA at the large text size used.

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/StatsBar/` with empty `.tsx` and `.css`. Export from `packages/ui/src/index.ts`.
2. Define `StatItem`, `StatsBarBackground`, and `StatsBarProps`. Export all three.
3. Build JSX per section 4 with `<ul role="list">` and `<li>` items.
4. Write CSS using tokens from section 5. Use CSS Grid with `grid-template-columns: repeat(4, 1fr)` for desktop.
5. Apply the fluid `clamp()` font-size to `.stats-bar__value` so numerals scale cleanly from mobile to desktop.
6. Add mobile media query that switches to `grid-template-columns: repeat(2, 1fr)` below 768px.
7. Add `@media (prefers-reduced-motion: reduce)` placeholder block.
8. Create `StatsBar.stories.tsx` with two stories: default (4 stats on secondary background) and primary-background variant.

## 10. Done Criteria

- Types compile, no `any`.
- Storybook renders both stories.
- Grid reflows to 2×2 on mobile.
- Numerals scale fluidly; no overflow at 375px.
- No raw hex values in CSS.
