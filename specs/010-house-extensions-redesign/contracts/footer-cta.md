# Component Contract: FooterCTA

**Feature**: 010-house-extensions-redesign
**Package**: `packages/ui/src/components/FooterCTA/`
**Template reference**: `.template/house-extensions/house-extensions-design.html` — Section 8 (Footer CTA)

---

## Interface

```typescript
import { type LinkRenderer } from '../types';

export interface FooterCTAAction {
  /** Button display text */
  label: string;
  /** Navigation target URL or tel: link */
  href: string;
  /** Visual style: 'primary' = solid brand button, 'ghost' = transparent border button */
  variant: 'primary' | 'ghost';
  /** Optional click handler (runs in addition to navigation) */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface FooterCTAProps {
  /** Main heading displayed in large display/serif font */
  title: string;
  /** Supporting paragraph below the heading */
  subtitle: string;
  /** One or two action buttons. Renders inline on desktop, stacked on mobile. */
  actions: FooterCTAAction[];
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
packages/ui/src/components/FooterCTA/
├── FooterCTA.tsx
├── FooterCTA.css
└── FooterCTA.test.tsx
```

### Step 2 — Build the markup (`FooterCTA.tsx`)

Implement the component with this exact DOM structure:

1. Root `<section>` — dark background, centred text. Combine BEM block class with any passed `className`.
2. Inner container — `max-width: 672px` (42rem), horizontal auto-margin, text-align centre.
3. **Heading** — `<h2>`, display/serif font, bold, white text (near-white `--brand-bg-primary`).
4. **Subtitle** — `<p>`, body font, muted white text (`opacity: 0.8`), bottom margin.
5. **Actions row** — `<div>` with flex layout:
   - Desktop (`sm`+): horizontal row, centred, `gap: 1rem`.
   - Mobile: vertical stack, full-width buttons, `gap: 1rem`.
   - Map `props.actions` to link elements. For each action:
     - If `props.renderLink` is provided, use it to render the link (for SPA navigation).
     - Otherwise, render a standard `<a>` element.
     - Apply the variant class: `footer-cta__action--primary` or `footer-cta__action--ghost`.

Key rules:
- The component **always** uses `--brand-bg-dark` (#1A1714) as its own background — this is not configurable because the dark CTA strip is its sole visual identity.
- If `actions` is empty, hide the actions row but still render heading + subtitle.
- No internal state. Pure presentational component.
- Use an internal `LinkItem` helper (consistent with existing hero components) to bridge `renderLink` or fall back to `<a>`.

### Step 3 — Build the LinkItem helper

Create a small private component inside `FooterCTA.tsx` (do not export):

```tsx
interface LinkItemProps {
  href: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  renderLink?: LinkRenderer;
  children: React.ReactNode;
}

const LinkItem: React.FC<LinkItemProps> = ({ href, className, onClick, renderLink, children }) => {
  if (renderLink) {
    return renderLink({ href, className, onClick, children });
  }
  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
};
```

This matches the pattern used in `HeroBoldBottomText` and `HeroWithSideText`.

### Step 4 — Write styles (`FooterCTA.css`)

Use BEM class names. Reference design tokens.

```
.footer-cta                                /* Block: root <section> */
.footer-cta__container                     /* Element: centred max-width wrapper */
.footer-cta__title                         /* Element: h2 heading */
.footer-cta__subtitle                      /* Element: supporting paragraph */
.footer-cta__actions                       /* Element: button row/stack */
.footer-cta__action                        /* Element: individual button/link */
.footer-cta__action--primary               /* Modifier: solid brand button */
.footer-cta__action--ghost                 /* Modifier: transparent border button */
```

Token mapping:

| Element | Font | Size | Weight | Colour | Notes |
|---------|------|------|--------|--------|-------|
| Section bg | — | — | — | `--brand-bg-dark` (#1A1714) | Always dark |
| Title | `--font-serif` | `--text-heading-l` (clamp 1.75–2.5rem) | 700 | `#FEFEFE` (near-white) | — |
| Subtitle | `--font-sans` | `--text-body-l` (1.125rem) | 400 | `#FEFEFE` with `opacity: 0.8` | `margin-bottom: 3rem` |
| Primary button | `--font-sans` | `--text-body` (1rem) | 600 | text: `--brand-title`, bg: `--brand-link` faded to container colour | Uses existing primary-container pattern |
| Ghost button | `--font-sans` | `--text-body` (1rem) | 600 | text: `#FEFEFE`, border: `rgba(255,255,255,0.3)` | Transparent bg |

Button styles:

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | Brand accent (`--brand-link` / primary-container equivalent) | Near-white or on-primary-container | none | Darken bg to `--brand-link-hover`, 0.3s ease |
| `ghost` | `transparent` | `#FEFEFE` | `1px solid rgba(227,227,222,0.3)` | `bg: rgba(227,227,222,0.1)`, 0.3s ease |

Both button variants: `padding: 1rem 2rem`, `border-radius: 0.25rem`, `font-weight: 600`, `text-align: center`.

Section padding: `padding: 6rem 1.5rem`.

### Step 5 — Write unit tests (`FooterCTA.test.tsx`)

Use Vitest + React Testing Library. Cover the following:

| # | Test case | Assertion |
|---|-----------|-----------|
| 1 | Renders title as h2 | `screen.getByRole('heading', { level: 2 })` contains expected text |
| 2 | Renders subtitle text | Subtitle text is present in the document |
| 3 | Renders all action buttons | Number of `.footer-cta__action` elements equals `actions.length` |
| 4 | Primary action has correct class | Element has `.footer-cta__action--primary` |
| 5 | Ghost action has correct class | Element has `.footer-cta__action--ghost` |
| 6 | Action links have correct href | Each `<a>` has the expected `href` attribute |
| 7 | Uses renderLink when provided | Custom render function is called instead of native `<a>` |
| 8 | onClick fires on action click | Mock function is called on user click |
| 9 | Empty actions array | Actions row is not rendered; heading + subtitle still render |
| 10 | Custom className is applied | Root `<section>` has the additional class |
| 11 | Dark background class present | Root element has `.footer-cta` class (visual regression relies on CSS, but class must exist) |

### Step 6 — Export from package index

Add to `packages/ui/src/index.ts`:

```typescript
export {
  FooterCTA,
  type FooterCTAProps,
  type FooterCTAAction,
} from './components/FooterCTA/FooterCTA';
```

---

## Rendering Contract

### Layout

- **All breakpoints**: Single centred column, `max-width: 672px` (42rem), `margin: 0 auto`, `text-align: center`.
- **Desktop (≥ 640px / `sm`)**: Actions row is horizontal flex (`flex-direction: row`, `justify-content: center`, `gap: 1rem`).
- **Mobile (< 640px)**: Actions stack vertically (`flex-direction: column`, full-width buttons).
- **Vertical padding**: `6rem` all breakpoints.

### Semantic HTML Structure

```html
<section class="footer-cta" aria-labelledby="footer-cta-title">
  <div class="footer-cta__container">
    <h2 id="footer-cta-title" class="footer-cta__title">
      Ready to Extend Your Home?
    </h2>
    <p class="footer-cta__subtitle">
      Contact our Dublin-based team to discuss your vision and arrange a complimentary site survey.
    </p>
    <div class="footer-cta__actions">
      <a class="footer-cta__action footer-cta__action--primary" href="/contact">
        Get a Free Quote
      </a>
      <a class="footer-cta__action footer-cta__action--ghost" href="tel:+353...">
        Call Us Today
      </a>
    </div>
  </div>
</section>
```

### Accessibility

- Root `<section>` uses `aria-labelledby` pointing to the `<h2>` id.
- Action links use `<a>` elements (or `renderLink` output) — natively focusable and keyboard-activatable.
- `tel:` links are valid `href` values for the "Call Us Today" action.
- Focus-visible outlines on action buttons: `outline: 2px solid #4f46e5; outline-offset: 2px` (project standard).
- Colour contrast: white text (#FEFEFE) on dark bg (#1A1714) = 17.4:1 ✓ (passes AAA). Subtitle at 0.8 opacity ≈ #CBCBC6 on #1A1714 = 11.2:1 ✓.
- `prefers-reduced-motion`: hover transitions disabled via project-wide media query. No other animations.

### Usage example from the page

```tsx
<FooterCTA
  title="Ready to Extend Your Home?"
  subtitle="Contact our Dublin-based team to discuss your vision and arrange a complimentary site survey."
  actions={[
    { label: 'Get a Free Quote', href: '/contact', variant: 'primary' },
    { label: 'Call Us Today', href: 'tel:+353XXXXXXX', variant: 'ghost' },
  ]}
  renderLink={renderLink}
/>
```
