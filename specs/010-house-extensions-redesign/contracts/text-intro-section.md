# Component Contract: TextIntroSection

**Feature**: 010-house-extensions-redesign
**Package**: `packages/ui/src/components/TextIntroSection/`
**Template reference**: `.template/house-extensions/house-extensions-design.html` — Section 2

---

## Interface

```typescript
export interface TextIntroSectionProps {
  /** Uppercase eyebrow label displayed between decorative horizontal rules (e.g. "WHY HOUSE EXTENSIONS") */
  eyebrow: string;
  /** Section heading rendered as h2 in display/serif font */
  title: string;
  /** Array of body paragraphs — each string becomes its own <p> element */
  paragraphs: string[];
  /** Optional CSS class for the root <section> element */
  className?: string;
}
```

---

## Implementation Steps

### Step 1 — Scaffold files

Create the component folder and empty files:

```
packages/ui/src/components/TextIntroSection/
├── TextIntroSection.tsx
├── TextIntroSection.css
└── TextIntroSection.test.tsx
```

### Step 2 — Build the markup (`TextIntroSection.tsx`)

Implement the component with this exact DOM structure:

1. Root `<section>` with `className` combining BEM block class and any passed `className`.
2. Inner centred container (`max-width: 768px`, horizontal auto-margin, text-align centre).
3. **Eyebrow row** — a flex container (centred, row, gap) holding:
   - Left decorative rule (`<div>`, 1px height, 32px width, brand accent colour).
   - Eyebrow `<span>` (uppercase, wide tracking, small font, brand accent colour).
   - Right decorative rule (same as left).
4. **Heading** — `<h2>` in display/serif font, bold, larger size, standard heading colour.
5. **Paragraph container** — `<div>` with vertical spacing between children. Map `props.paragraphs` to `<p>` elements (body font, large size, relaxed line-height, secondary text colour). Use `index` as key since paragraphs are static content.
6. **Bottom divider** — `<div>`, 48px width, 1px height, centred, muted border colour, top margin.

Key rules:
- The component must **not** set its own background colour — the consuming page controls the section background via a wrapper or the `className` prop.
- If `paragraphs` is empty, still render the eyebrow + title + divider (no paragraph container).
- No internal state. This is a pure presentational component.

### Step 3 — Write styles (`TextIntroSection.css`)

Use BEM class names. Reference design tokens from `tokens.css` / `style.css`.

```
.text-intro-section                        /* Block: root <section> */
.text-intro-section__container             /* Element: centred max-width wrapper */
.text-intro-section__eyebrow-row           /* Element: flex row holding rules + label */
.text-intro-section__rule                  /* Element: decorative horizontal line */
.text-intro-section__eyebrow              /* Element: uppercase label text */
.text-intro-section__title                 /* Element: h2 heading */
.text-intro-section__body                  /* Element: paragraph container */
.text-intro-section__paragraph             /* Element: individual <p> */
.text-intro-section__divider               /* Element: bottom decorative line */
```

Token mapping:

| Element | Font | Size | Weight | Colour | Spacing |
|---------|------|------|--------|--------|---------|
| Eyebrow | `--font-sans` (Inter) | `--text-tiny` (0.75rem) | 600 | `--brand-link` (#B55329) | `letter-spacing: --tracking-wide (0.12em)`, `text-transform: uppercase` |
| Rule | — | — | — | `--brand-link` (#B55329) | `height: 1px`, `width: 32px` |
| Title | `--font-serif` | `--text-heading-l` (clamp 1.75–2.5rem) | 700 | `--brand-title` (#121414) | `margin-bottom: 2rem` |
| Paragraph | `--font-sans` (Inter) | `--text-body-l` (1.125rem) | 400 | `--brand-slate` (#555555) | `line-height: --lh-relaxed (1.625)` |
| Divider | — | — | — | `--brand-bd-color` (#E5E7DE) | `height: 1px`, `width: 48px`, `margin-top: 4rem` |

Section padding: `padding: 6rem 1.5rem` (desktop `8rem 1.5rem` at `md` breakpoint).

### Step 4 — Write unit tests (`TextIntroSection.test.tsx`)

Use Vitest + React Testing Library. Cover the following:

| # | Test case | Assertion |
|---|-----------|-----------|
| 1 | Renders eyebrow text | `screen.getByText('WHY HOUSE EXTENSIONS')` is in the document |
| 2 | Renders title as h2 | `screen.getByRole('heading', { level: 2 })` contains expected text |
| 3 | Renders all paragraphs | `container.querySelectorAll('.text-intro-section__paragraph')` length equals `paragraphs.length` |
| 4 | Renders decorative rules | Two elements with class `.text-intro-section__rule` exist |
| 5 | Renders bottom divider | One element with class `.text-intro-section__divider` exists |
| 6 | Empty paragraphs array | Component renders without errors; paragraph container is absent |
| 7 | Applies custom className | Root `<section>` has the additional class |

### Step 5 — Export from package index

Add to `packages/ui/src/index.ts`:

```typescript
export { TextIntroSection, type TextIntroSectionProps } from './components/TextIntroSection/TextIntroSection';
```

---

## Rendering Contract

### Layout

- **All breakpoints**: Single centred column, `max-width: 768px`, `margin: 0 auto`.
- **Desktop (≥ 768px)**: `padding: 8rem 1.5rem`.
- **Mobile (< 768px)**: `padding: 6rem 1.5rem`.

### Semantic HTML Structure

```html
<section class="text-intro-section">
  <div class="text-intro-section__container">
    <!-- Eyebrow row -->
    <div class="text-intro-section__eyebrow-row">
      <div class="text-intro-section__rule" aria-hidden="true"></div>
      <span class="text-intro-section__eyebrow">WHY HOUSE EXTENSIONS</span>
      <div class="text-intro-section__rule" aria-hidden="true"></div>
    </div>

    <!-- Heading -->
    <h2 class="text-intro-section__title">Your Space. Your Vision.</h2>

    <!-- Body paragraphs -->
    <div class="text-intro-section__body">
      <p class="text-intro-section__paragraph">
        Whether you are envisioning a light-filled open-plan kitchen...
      </p>
      <p class="text-intro-section__paragraph">
        In Dublin, where architectural heritage meets modern living demands...
      </p>
    </div>

    <!-- Bottom divider -->
    <div class="text-intro-section__divider" aria-hidden="true"></div>
  </div>
</section>
```

### Accessibility

- Decorative rules and bottom divider use `aria-hidden="true"` (no semantic meaning).
- Heading hierarchy: the `<h2>` fits within the page's `<h1>` (in the hero) → `<h2>` pattern.
- No interactive elements — no keyboard/focus handling needed.
- Sufficient colour contrast: `--brand-slate` (#555555) on `--brand-bg-primary` (#FEFEFE) = ratio 7.4:1 (passes AA and AAA).
- `prefers-reduced-motion`: No animations in this component — no action needed.
