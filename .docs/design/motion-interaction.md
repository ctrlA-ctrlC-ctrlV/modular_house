# Motion & Interaction

---

## Timing Scale

| Duration | Easing | Usage |
|----------|--------|-------|
| `0.2s` | `ease` | Micro-interactions: link color, border color, opacity |
| `0.3s` | `ease` | Standard transforms: gallery zoom, button lift |
| `0.35s` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Emphasis: product row hover, card expansion |
| `150–200ms` | `ease` | Admin panel transitions |

---

## Hover Effects

### Buttons
- `transform: translateY(-1px)` — subtle lift
- Box-shadow increases on hover
- Color transitions from `--brand-link` → `--brand-link-hover` (0.2s)

### Cards / Product Rows
- `transform: scale(1.015)` — gentle zoom
- Shadow transitions from `none` → `--shadow-natural`
- Timing: 0.35s with custom cubic-bezier

### Gallery Images
- `transform: scale(1.05)` — zoom in
- Timing: 0.3s ease
- Optional opacity overlay fade

### Links
- Color transition: 0.2s ease
- Underline appears/disappears on hover (depends on context)

### Navigation Submenus
- `animation: fadeIn 0.2s ease-out`
- Dropdown appears below parent menu item

---

## Transforms in Use

| Transform | Context |
|-----------|---------|
| `translateY(-1px)` | Button hover lift |
| `translateX(-50%) translateY(-50%)` | Absolute centering |
| `rotate(180deg)` | Accordion chevron toggle |
| `scale(1.015)` | Product card hover |
| `scale(1.05)` | Gallery image hover |

---

## Scroll Behavior

- **Smooth scroll**: Enabled for anchor links
- **Infinite scroll**: InfiniteMasonryGallery triggers `onLoadMore` at scroll threshold
- **Sticky header**: Remains fixed at top on scroll

---

## Modal Transitions

- **Enter**: Fade-in overlay + scale-up content
- **Exit**: Reverse on close, Escape key, or overlay click
- **Body scroll lock**: `overflow: hidden` on `<body>` when modal is open

---

## Carousel (Mobile FeatureSection)

- Horizontal swipe gesture (touch events)
- Dot indicators for current position
- No auto-play (user-initiated only)

---

## Accessibility: Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

All hover transforms, fade animations, and carousel sliding are disabled when the user has enabled reduced motion in their OS settings. Focus transitions are instant regardless of this setting.
