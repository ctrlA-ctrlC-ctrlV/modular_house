# Design Tokens

All tokens are defined as CSS custom properties in `apps/web/src/styles/style.css` and `apps/web/src/styles/tokens.css`.

---

## Color Tokens

### Core Brand

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-link` | `#B55329` | Primary CTA, links, brand accent |
| `--brand-link-hover` | `#9F4017` | Hover state for primary actions |
| `--brand-ink` | `#1a1a1a` | Body text |
| `--brand-title` | `#121414` | Headings |
| `--brand-slate` | `#555555` | Secondary body text |
| `--brand-stone` | `#888888` | Tertiary text, metadata |
| `--brand-meta` | `#ACAFB2` | Captions, timestamps |

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-bg-primary` | `#FEFEFE` | Main background |
| `--brand-bg-secondary` | `#F6F5F0` | Alternate sections (warm beige) |
| `--brand-bg-dark` | `#1A1714` | Dark sections, footer |
| `--brand-bd-color` | `#E5E7DE` | Borders, dividers |
| `--brand-border` | `#e0e0e0` | Light dividers |

### Extended Palette (Semantic)

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-vivid-red` | `#cf2e2e` | Error, danger |
| `--brand-luminous-vivid-amber` | `#f1cc53` | Warning, highlight accent |
| `--brand-vivid-green-cyan` | `#00d084` | Success |
| `--brand-vivid-cyan-blue` | `#0693e3` | Info, links (alt) |
| `--brand-vivid-purple` | `#9b51e0` | Decorative |
| `--brand-pale-pink` | `#f78da7` | Decorative |
| `--brand-cyan-bluish-gray` | `#abb8c3` | Disabled, muted |

### Gradients

| Token | Value |
|-------|-------|
| `--gradient-orange-brown` | `linear-gradient(215deg, #4F2412 0%, #B55329 100%)` |
| `--gradient-cyan-purple` | `linear-gradient(135deg, #0693e3 0%, #9b51e0 100%)` |
| `--gradient-green-cyan` | `linear-gradient(135deg, #7bdcb5 0%, #00d084 100%)` |
| + 10 additional gradient tokens | See `style.css` for full list |

---

## Typography Tokens

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-serif` | `'Special Gothic Condensed One', serif` | Display & heading text |
| `--font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Body text, UI elements |

### Type Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--text-display` | `clamp(2rem, 5vw, 3.5rem)` | Hero H1 |
| `--text-heading-l` | `clamp(1.75rem, 4vw, 2.5rem)` | Section H2 |
| `--text-heading-m` | `1.5rem` | Subsection H3 |
| `--text-heading-s` | `1.25rem` | H4 |
| `--text-body-l` | `1.125rem` | Lead paragraphs |
| `--text-body` | `1rem` | Standard body |
| `--text-caption` | `0.875rem` | Helper text |
| `--text-tiny` | `0.75rem` | Labels, eyebrows |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--weight-light` | `300` | Decorative, large display |
| `--weight-regular` | `400` | Body text |
| `--weight-medium` | `500` | Emphasis, eyebrows |
| `--weight-semibold` | `600` | Headings, buttons, labels |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tight` | `-0.02em` | Headlines |
| `--tracking-default` | `0em` | Body text |
| `--tracking-wide` | `0.12em` | Uppercase labels, eyebrows |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--lh-loose` | `2` | Spacious reading |
| `--lh-relaxed` | `1.625` | Comfortable body |
| `--lh-body` | `1.5` | Standard body |
| `--lh-snug` | `1.375` | Compact headings |
| `--lh-tight` | `1.2` | Display headings |
| `--lh-none` | `1` | Single-line elements |

---

## Spacing Tokens

**Base unit**: `--theme-spacing-unit: 8px`

| Name | Value | Px equivalent |
|------|-------|---------------|
| `xs` | `4px` | 4 |
| `sm` | `8px` | 8 |
| `md` | `16px` | 16 |
| `lg` | `24px` | 24 |
| `xl` | `32px` | 32 |
| `2xl` | `48px` | 48 |
| `3xl` | `64px` | 64 |
| `4xl` | `96px` | 96 |

---

## Shadow Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-natural` | `6px 6px 9px rgba(0,0,0,0.2)` | Cards, subtle elevation |
| `--shadow-deep` | `12px 12px 50px rgba(0,0,0,0.4)` | Modals, prominent elements |
| `--shadow-sharp` | `6px 6px 0px rgba(0,0,0,0.2)` | Hard-edge decorative |
| `--shadow-outlined` | `6px 6px 0px -3px #fff, 6px 6px #000` | Outlined effect |
| `--shadow-crisp` | `6px 6px 0px #000` | Solid black offset |

---

## Border & Radius Tokens

### Border Radius

| Usage | Value |
|-------|-------|
| Buttons, inputs, cards | `4px` |
| Modals | `4px–8px` |
| Large layout blocks | `0px` (sharp) |

### Border Styles

| Usage | Value |
|-------|-------|
| Input default | `1px solid #d1d5db` |
| Input focus | `1px solid var(--brand-link)` |
| Section dividers | `1px solid var(--brand-border)` |
| Unavailable product card | `dashed` border style |

### Focus Ring

| Property | Value |
|----------|-------|
| Color | `#4f46e5` (indigo-600) |
| Width | `2px` (3px in high-contrast mode) |
| Offset | `2px` |

---

## Aspect Ratio Tokens

| Token | Value |
|-------|-------|
| `--ratio-square` | `1 / 1` |
| `--ratio-4-3` | `4 / 3` |
| `--ratio-3-4` | `3 / 4` |
| `--ratio-3-2` | `3 / 2` |
| `--ratio-2-3` | `2 / 3` |
| `--ratio-16-9` | `16 / 9` |
| `--ratio-9-16` | `9 / 16` |
