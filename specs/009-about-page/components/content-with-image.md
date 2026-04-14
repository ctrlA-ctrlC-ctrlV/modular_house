# ContentWithImage

## 1. Purpose

A versatile two-column section that pairs editorial prose (multi-paragraph narrative) with a single supporting image. Distinct from `TwoColumnSplitLayout`, which carries dual images and bullet lists, `ContentWithImage` is optimised for long-form story content. Used on the About page for "Our Story" and reusable for Careers, Partnerships, or any editorial intro block.

## 2. Source Files

- `packages/ui/src/components/ContentWithImage/ContentWithImage.tsx`
- `packages/ui/src/components/ContentWithImage/ContentWithImage.css`
- `packages/ui/src/components/ContentWithImage/ContentWithImage.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
export type ContentWithImageAspectRatio = '1:1' | '4:5' | '3:4' | '16:9';
export type ContentWithImageBackground = 'primary' | 'secondary';

export interface ContentWithImageProps {
  /** Uppercase eyebrow label displayed above the heading. */
  eyebrow: string;
  /** Main section heading rendered as <h2>. */
  heading: string;
  /** Body content. Accepts ReactNode so callers can pass multiple <p> elements. */
  children: React.ReactNode;
  /** Primary image URL (fallback for the <picture> element). */
  imageSrc: string;
  /** WebP image variant URL. */
  imageWebP?: string;
  /** AVIF image variant URL. */
  imageAvif?: string;
  /** Alt text for the image. Required for accessibility. */
  imageAlt: string;
  /** Aspect ratio applied to the image container. @default '4:5' */
  imageAspectRatio?: ContentWithImageAspectRatio;
  /** When true, image is placed in the left column. @default false */
  imageFirst?: boolean;
  /** Background variant mapped to brand tokens. @default 'primary' */
  backgroundColor?: ContentWithImageBackground;
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
}
```

## 4. DOM Structure

```
<section class="content-with-image content-with-image--bg-{primary|secondary} [content-with-image--image-first]">
  <div class="content-with-image__inner">
    <div class="content-with-image__text">
      <span class="content-with-image__eyebrow">{eyebrow}</span>
      <h2 class="content-with-image__heading">{heading}</h2>
      <div class="content-with-image__body">{children}</div>
    </div>
    <div class="content-with-image__media content-with-image__media--ratio-{1-1|4-5|3-4|16-9}">
      <OptimizedImage class="content-with-image__image" .../>
    </div>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section padding (vertical) | `var(--spacing-4xl)` (96px) desktop, `var(--spacing-3xl)` mobile |
| Container max-width | `1320px` (section container) |
| Container horizontal padding | `20px` (responsive) |
| Grid column gap | `var(--spacing-2xl)` (48px) |
| Eyebrow color | `var(--brand-slate)` |
| Eyebrow font | `var(--font-sans)`, `var(--text-tiny)`, `var(--weight-semibold)`, `var(--tracking-wide)`, uppercase |
| Heading font | `var(--font-serif)`, `var(--text-heading-l)`, `var(--lh-tight)` |
| Heading color | `var(--brand-title)` |
| Body font | `var(--font-sans)`, `var(--text-body-l)`, `var(--lh-relaxed)` |
| Body color | `var(--brand-slate)` |
| Paragraph spacing | `var(--spacing-lg)` (24px) between `<p>` |
| Image border-radius | `4px` |
| Image shadow | `var(--shadow-natural)` |
| Background (primary) | `var(--brand-bg-primary)` |
| Background (secondary) | `var(--brand-bg-secondary)` |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | Two columns, 50/50 split. Column order respects `imageFirst`. |
| Tablet (768–992px) | Two columns, 50/50 split, reduced gap and padding. |
| Mobile (< 768px) | Single column stack. Text follows image when `imageFirst` is true; otherwise image follows text. |

## 7. Interaction & Motion

- The component is static — no hover states on the section itself.
- Image does not animate; its container preserves the aspect ratio to prevent layout shift.
- If the image is ever wrapped in an anchor by a consumer, the anchor inherits focus-visible styles from global CSS.

## 8. Accessibility Checklist

- Root element is `<section>` with `aria-labelledby` pointing at the heading's `id` (heading gets a stable `id` derived from the `id` prop or auto-generated).
- Single `<h2>` per section; do not ship multiple headings from `children`.
- `imageAlt` is required by the type — empty strings allowed only for decorative images (documented in JSDoc).
- All text-on-background combinations meet WCAG AA per `accessibility.md`.
- Image aspect-ratio container uses CSS `aspect-ratio` so no layout shift when the image loads.

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/ContentWithImage/` with empty `ContentWithImage.tsx` and `ContentWithImage.css`. Add a named export to `packages/ui/src/index.ts`.
2. Define `ContentWithImageAspectRatio`, `ContentWithImageBackground`, and `ContentWithImageProps` in `ContentWithImage.tsx`. Export them.
3. Implement the JSX structure with the BEM classes from section 4. Compute modifier classes from `imageFirst` and `backgroundColor` props. Do not add styling logic.
4. Wire `OptimizedImage` into the media slot, forwarding `imageSrc`, `imageWebP`, `imageAvif`, and `imageAlt`. Use `loading="lazy"` (not a hero image).
5. Write `ContentWithImage.css`: base styles (container, grid, typography) using only the tokens from section 5. Desktop-first.
6. Add the `--image-first` modifier rule that reorders the grid columns (`grid-template-columns` + `order`).
7. Add tablet and mobile media queries matching the table in section 6; collapse to a single column at 768px.
8. Add a `@media (prefers-reduced-motion: reduce)` block disabling any future transitions (future-proofing placeholder).
9. Create `ContentWithImage.stories.tsx` with three stories: default, `imageFirst={true}`, and `backgroundColor="secondary"`.

## 10. Done Criteria

- TypeScript builds without errors or `any` usage.
- Storybook renders all three stories without visual regressions.
- Manual QA at 1440px, 900px, and 375px widths matches the About template visually.
- `<section>` has `aria-labelledby` pointing at the rendered heading id.
- No raw hex values appear in the CSS file.
