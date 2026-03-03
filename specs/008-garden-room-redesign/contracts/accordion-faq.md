# Component Contract: AccordionFAQ

**Feature**: 008-garden-room-redesign
**Package**: `packages/ui/src/components/AccordionFAQ/`

## Interface

```typescript
export interface AccordionFAQItem {
  /** Unique identifier for ARIA attributes (e.g., "faq-1") */
  id: string;
  /** Display number for the FAQ item (e.g., "01", "02") */
  number: string;
  /** Question text displayed as the clickable heading */
  title: string;
  /** Answer text revealed when expanded */
  description: string;
}

export interface AccordionFAQProps {
  /** Large decorative title displayed above the FAQ list */
  title?: string;
  /** Array of FAQ items to render */
  faqs: AccordionFAQItem[];
  /** Optional CSS class name for custom styling extensions */
  className?: string;
  /** Optional callback when an FAQ item is toggled */
  onToggle?: (item: AccordionFAQItem, index: number, isOpen: boolean) => void;
}
```

## Rendering Contract

### Layout
- **Desktop (1280px+)**: Single-column list, max-width 900px centered
- **Tablet (768-1279px)**: Same layout, padding adjusts
- **Mobile (<768px)**: Full-width stack, padding 16px
- **Vertical padding**: 80px top / 80px bottom (matching other sections)

### Item Structure
Each accordion item renders in this order:
1. **Header row** — Clickable trigger containing:
   - Number (left-aligned, large monospace/serif style)
   - Question title (flex-grow, fills remaining space)
   - Chevron icon (right-aligned, rotates 180° when open)
2. **Content panel** — Collapsible region containing:
   - Answer text paragraph
   - Smooth height transition (300ms ease)

### Behaviour
- **Independent toggle**: Multiple items can be open simultaneously
- **Initial state**: All items collapsed on mount
- **Toggle**: Click/Enter/Space on the header row toggles the item
- **Animation**: Content panel slides open/closed with CSS `max-height` + `overflow: hidden` transition (300ms ease)

### Visual Style
- Matches existing brand design system (Libre Baskerville headings, Inter body)
- Number column: `var(--text-heading-m)`, colour `var(--brand-link, #B55329)`
- Title text: `var(--font-serif)`, `var(--text-heading-s)`, colour `var(--theme-color-heading)`
- Description text: `var(--text-body)`, colour `var(--theme-color-body)`
- Horizontal divider between items: 1px solid `var(--theme-color-border, #E5E7DE)`
- Chevron: 16px, colour `var(--theme-color-meta)`, `transform: rotate(180deg)` when open, transition 300ms
- Hover: Header row background lightens subtly (`rgba(0,0,0,0.02)`)

### CSS Class Convention (BEM)
```
.accordion-faq                          /* Block: section wrapper */
.accordion-faq__header                  /* Element: section title */
.accordion-faq__title                   /* Element: h2 heading */
.accordion-faq__list                    /* Element: list container */

.accordion-faq-item                     /* Block: individual item */
.accordion-faq-item--open              /* Modifier: expanded state */
.accordion-faq-item__trigger           /* Element: clickable header row */
.accordion-faq-item__number            /* Element: number display */
.accordion-faq-item__question          /* Element: question title */
.accordion-faq-item__chevron           /* Element: expand/collapse icon */
.accordion-faq-item__panel             /* Element: collapsible content */
.accordion-faq-item__answer            /* Element: answer paragraph */
```

### Accessibility
- Section uses `<section>` with `aria-labelledby` pointing to the title's `id`
- Each header row is a `<button>` with:
  - `aria-expanded="true"` / `aria-expanded="false"` reflecting open/closed state
  - `aria-controls="panel-{id}"` pointing to the content panel's `id`
- Each content panel is a `<div>` with:
  - `id="panel-{id}"` matching the trigger's `aria-controls`
  - `role="region"`
  - `aria-labelledby="trigger-{id}"`
  - `hidden` attribute when collapsed (removed when expanded)
- Keyboard: Enter and Space toggle the focused item
- Focus-visible outline on trigger buttons
- No focus trap — Tab moves to next focusable element

### Semantic HTML Structure
```html
<section class="accordion-faq" aria-labelledby="accordion-faq-title">
  <div class="accordion-faq__header">
    <h2 id="accordion-faq-title" class="accordion-faq__title">FAQ</h2>
  </div>
  <div class="accordion-faq__list">
    <div class="accordion-faq-item accordion-faq-item--open">
      <button
        class="accordion-faq-item__trigger"
        id="trigger-faq-1"
        aria-expanded="true"
        aria-controls="panel-faq-1"
      >
        <span class="accordion-faq-item__number">01</span>
        <span class="accordion-faq-item__question">Do I need planning permission?</span>
        <span class="accordion-faq-item__chevron" aria-hidden="true">▾</span>
      </button>
      <div
        class="accordion-faq-item__panel"
        id="panel-faq-1"
        role="region"
        aria-labelledby="trigger-faq-1"
      >
        <p class="accordion-faq-item__answer">
          Under current Irish law, garden rooms up to 25m² are exempt...
        </p>
      </div>
    </div>
    <!-- ... more items -->
  </div>
</section>
```

### State Management
- Uses `React.useState<Set<string>>` to track which item IDs are currently open
- Toggle function adds/removes IDs from the Set
- Multiple items can be open simultaneously (independent toggle)
- No controlled/uncontrolled mode — always internal state
