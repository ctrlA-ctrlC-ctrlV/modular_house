# GradientCTA

## 1. Purpose

A full-width, high-conversion call-to-action banner rendered on the brand signature gradient (`--gradient-orange-brown`). Content is centered: heading, supporting subtext, and a single prominent white button. Used as the final section on the About page and reusable as the closing CTA on every marketing page (Garden Room, House Extension, Contact, Landing).

## 2. Source Files

- `packages/ui/src/components/GradientCTA/GradientCTA.tsx`
- `packages/ui/src/components/GradientCTA/GradientCTA.css`
- `packages/ui/src/components/GradientCTA/GradientCTA.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
import { LinkRenderer } from '../../types';

export interface GradientCTAProps {
  /** Primary heading rendered as <h2>. */
  heading: string;
  /** Supporting subtext below the heading. */
  subtext: string;
  /** CTA label. */
  ctaLabel: string;
  /**
   * Optional href for the CTA. When supplied, the CTA renders as an <a>.
   * When omitted, the CTA renders as a <button> and uses `onCtaClick`.
   */
  ctaHref?: string;
  /**
   * Click handler for the button form of the CTA. Required when `ctaHref` is
   * absent; ignored when `ctaHref` is supplied.
   */
  onCtaClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Optional renderer that bridges the CTA anchor to an external router
   * (e.g., React Router). Keeps @modular-house/ui router-agnostic.
   */
  linkRenderer?: LinkRenderer;
  /** Accessible label for the <section>. @default 'Call to action' */
  ariaLabel?: string;
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
}
```

## 4. DOM Structure

```
<section class="gradient-cta" aria-label={ariaLabel}>
  <div class="gradient-cta__inner">
    <h2 class="gradient-cta__heading">{heading}</h2>
    <p class="gradient-cta__subtext">{subtext}</p>
    {/* Anchor or button form — chosen by props */}
    <a  class="gradient-cta__button" href={ctaHref}>{ctaLabel}</a>
    <button type="button" class="gradient-cta__button" onClick={onCtaClick}>{ctaLabel}</button>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section background | `var(--gradient-orange-brown)` |
| Section padding (vertical) | `var(--spacing-3xl)` (64px) |
| Container max-width | `1200px` (content container; narrower than other sections for CTA focus) |
| Heading font | `var(--font-serif)` |
| Heading size | `var(--text-display)` |
| Heading color | `var(--brand-bg-primary)` (#FEFEFE) |
| Heading line-height | `var(--lh-tight)` |
| Subtext font | `var(--font-sans)`, `var(--text-body-l)` |
| Subtext color | `var(--brand-bg-primary)` at 80% (use `opacity: 0.8` on the element) |
| Subtext max-width | `600px` (centered) |
| Button background | `var(--brand-bg-primary)` |
| Button text color | `var(--brand-title)` |
| Button font | `var(--font-serif)`, `var(--text-body)`, `var(--weight-semibold)`, `var(--tracking-wide)`, uppercase |
| Button padding | `var(--spacing-lg) var(--spacing-2xl)` (24px 48px) |
| Button border-radius | `4px` |
| Heading-subtext gap | `var(--spacing-xl)` (32px) |
| Subtext-button gap | `var(--spacing-2xl)` (48px) |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | Centered content stack. Heading uses upper end of `clamp()`. |
| Tablet (768–992px) | Same stack, reduced vertical padding. |
| Mobile (< 768px) | Single column; button width limited to a readable maximum (`min(100%, 320px)`). |

## 7. Interaction & Motion

- Button hover: `transform: scale(1.05)`, `box-shadow` increase. Transition `0.2s ease`.
- Button hover: background lifts from `var(--brand-bg-primary)` to a slightly cooler off-white (use `#ffffff` → `var(--surface-container-low)` equivalent token or keep a subtle opacity shift).
- Button `:focus-visible`: `outline: 2px solid #4f46e5; outline-offset: 2px` (global pattern).
- `@media (prefers-reduced-motion: reduce)`: scale transform removed; color transitions instant.

## 8. Accessibility Checklist

- `<section>` with `aria-label` (heading provides the visual title but a redundant `aria-label` guarantees clear landmark naming).
- Heading is `<h2>`; only one `<h2>` per CTA.
- CTA renders as either `<a>` (when `ctaHref` is provided) or `<button type="button">` (when `onCtaClick` is used). Never both.
- Button text must meet AA contrast against white background — `var(--brand-title)` meets ~17:1.
- Gradient has enough luminance contrast at every stop for white heading text (verified in design tokens).
- When `linkRenderer` is used, the spec demands the renderer produces a real `<a>` (or a component that forwards to `<a>`), preserving keyboard/screen-reader semantics.

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/GradientCTA/` with empty `.tsx` and `.css`. Export from `packages/ui/src/index.ts`.
2. Define `GradientCTAProps`. Import and re-expose `LinkRenderer` from `../../types`.
3. Build JSX with classes from section 4. Branch rendering between `<a>` (with or without `linkRenderer`) and `<button>` based on `ctaHref` presence.
4. Validate the mutually-exclusive-prop pattern with a small internal helper `resolveCtaElement(props)` that returns the correct element; document the mutual exclusion in JSDoc on `ctaHref` and `onCtaClick`.
5. Write CSS using the gradient and typography tokens from section 5. Apply the gradient via `background: var(--gradient-orange-brown);`.
6. Style the button with hover and focus-visible rules; implement the `scale(1.05)` transform and shadow on hover.
7. Add mobile media query with the `min(100%, 320px)` button width constraint.
8. Wrap hover transform in `@media (prefers-reduced-motion: reduce)` to disable the animation but keep color change.
9. Create `GradientCTA.stories.tsx` with three stories: anchor form (`ctaHref`), button form (`onCtaClick`), and `linkRenderer` form (mock renderer producing an `<a>`).

## 10. Done Criteria

- Types compile, no `any`.
- Storybook renders all three CTA forms.
- Anchor form renders as `<a>`, button form as `<button>`, linkRenderer form preserves an anchor element.
- Focus ring visible on keyboard focus, matching global style.
- Scale hover transform stops animating when reduced-motion is active.
- No raw hex values in the CSS file beyond those already encapsulated in the gradient token.
