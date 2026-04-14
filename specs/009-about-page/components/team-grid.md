# TeamGrid

## 1. Purpose

A dark-theme section displaying team members in a responsive grid. Each member is shown with a circular avatar, name, role, and short bio. The grid sits on a near-black background to contrast with the surrounding light sections and draw focus to the people behind the brand. Used on the About page for "Our Team" and reusable for leadership, advisors, and contributor pages.

## 2. Source Files

- `packages/ui/src/components/TeamGrid/TeamGrid.tsx`
- `packages/ui/src/components/TeamGrid/TeamGrid.css`
- `packages/ui/src/components/TeamGrid/TeamGrid.stories.tsx`
- Export added to `packages/ui/src/index.ts`

## 3. Props Contract

```typescript
export interface TeamMember {
  /** Stable key for the member (e.g., slug of the name). */
  id: string;
  /** Full name. */
  name: string;
  /** Job title or role. */
  role: string;
  /** Short biography — one or two sentences. */
  bio: string;
  /** Avatar image source (fallback). */
  imageSrc: string;
  /** WebP variant URL. */
  imageWebP?: string;
  /** AVIF variant URL. */
  imageAvif?: string;
  /** Alt text — typically "Portrait of {name}". */
  imageAlt: string;
}

export interface TeamGridProps {
  /** Uppercase eyebrow label above the heading. */
  eyebrow: string;
  /** Section heading rendered as <h2>. */
  heading: string;
  /** Team members to display. */
  members: TeamMember[];
  /** Optional className appended to the root element. */
  className?: string;
  /** Optional id for anchor linking. */
  id?: string;
}
```

## 4. DOM Structure

```
<section class="team-grid">
  <div class="team-grid__inner">
    <header class="team-grid__header">
      <span class="team-grid__eyebrow">{eyebrow}</span>
      <h2 class="team-grid__heading">{heading}</h2>
    </header>
    <ul class="team-grid__list" role="list">
      <li class="team-grid__item" key={member.id}>
        <article class="team-member">
          <div class="team-member__avatar">
            <OptimizedImage class="team-member__image" .../>
          </div>
          <h3 class="team-member__name">{member.name}</h3>
          <p class="team-member__role">{member.role}</p>
          <p class="team-member__bio">{member.bio}</p>
        </article>
      </li>
    </ul>
  </div>
</section>
```

## 5. Design Token Mapping

| Property | Token |
|----------|-------|
| Section background | `var(--brand-bg-dark)` (#1A1714) |
| Section padding (vertical) | `var(--spacing-4xl)` desktop, `var(--spacing-3xl)` mobile |
| Container max-width | `1320px` |
| Header bottom margin | `var(--spacing-4xl)` |
| Avatar size | `192px` square |
| Avatar border-radius | `50%` |
| Avatar ring color | `var(--brand-link)` at 20% opacity (CSS `rgb(from ...)` or the raw token with `/ 0.2`) |
| Avatar ring width | `2px`, `4px` inner padding |
| Eyebrow color | `var(--brand-link)` (copper on dark) |
| Heading font | `var(--font-serif)`, `var(--text-heading-l)` |
| Heading color | `#FEFEFE` (use `var(--brand-bg-primary)`) |
| Name font | `var(--font-serif)`, `var(--text-heading-s)` |
| Name color | `var(--brand-bg-primary)` |
| Role color | `var(--brand-link)` |
| Role font | `var(--font-sans)`, `var(--text-tiny)`, `var(--weight-semibold)`, `var(--tracking-wide)`, uppercase |
| Bio color | `var(--brand-stone)` |
| Bio font | `var(--font-sans)`, `var(--text-caption)`, `var(--lh-relaxed)` |
| Grid column gap | `var(--spacing-2xl)` |

## 6. Responsive Behaviour

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 992px) | 4 columns, left-aligned content under each avatar. |
| Tablet (768–992px) | 2 columns. |
| Mobile (< 768px) | 1 column, content centered under a centered avatar. |

## 7. Interaction & Motion

- Avatar resting state: `filter: grayscale(1)`.
- Avatar hover: `filter: grayscale(0)`, transition `0.3s ease`.
- Hover also applies to keyboard focus on the parent `<li>` via `:focus-within` so that keyboard users get the same visual cue when tabbing through a focusable descendant (if one is added later).
- `@media (prefers-reduced-motion: reduce)`: transition is removed; grayscale still toggles instantly on hover so the effect remains accessible.

## 8. Accessibility Checklist

- `<section>` with `aria-labelledby` on heading.
- `<ul role="list">` (Safari reset).
- Heading hierarchy: `<h2>` section heading, `<h3>` member names.
- Each avatar has `imageAlt`. Default caller pattern: `"Portrait of {name}, {role}"`.
- Grayscale filter is decorative and does not affect semantic content.
- Contrast: all text against `#1A1714` background meets AA per `accessibility.md`:
  - Primary white on dark ≈ 16:1 (AAA)
  - Copper `#B55329` on dark ≈ 4.5:1 (AA)
  - Stone `#888888` on dark ≈ 4.0:1 — keep bio text at least 14px.
- Bio text must never drop below 14px to preserve contrast.

## 9. Task Breakdown

1. Scaffold `packages/ui/src/components/TeamGrid/` with empty `.tsx` and `.css`. Export from `packages/ui/src/index.ts`.
2. Define `TeamMember` and `TeamGridProps`. Export both.
3. Build JSX with classes from section 4. Extract a co-located `TeamMemberCard` internal component for readability.
4. Wire `OptimizedImage` inside `.team-member__avatar` with `loading="lazy"`.
5. Write base CSS using the dark background and typography tokens from section 5. Implement the circular avatar with a `padding: 4px; border: 2px solid rgb(from var(--brand-link) r g b / 0.2);` ring.
6. Add responsive grid rules per section 6 (4 → 2 → 1 columns, alignment changes on mobile).
7. Implement the grayscale-to-color hover transition and the `prefers-reduced-motion` override per section 7.
8. Create `TeamGrid.stories.tsx` with one story (4 members) and one edge-case story (2 members, to confirm grid centering behaviour).

## 10. Done Criteria

- Types compile, no `any`.
- Storybook stories render with dark backgrounds and circular avatars.
- Grayscale hover effect works; reduced-motion disables the animation but not the color swap.
- At 375px, avatars and text are centered.
- No raw hex values other than transparency overlays applied to brand tokens.
