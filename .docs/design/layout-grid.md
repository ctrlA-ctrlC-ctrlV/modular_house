# Layout & Grid System

---

## Container Widths

| Context | Max-width | Centering |
|---------|-----------|-----------|
| Header | 1650px | `margin: 0 auto` |
| Sections | 1320px | `margin: 0 auto` |
| Content | 1200px | `margin: 0 auto` |

All containers use horizontal padding of 20px that adjusts responsively.

---

## Responsive Breakpoints

| Name | Range | Columns | Notes |
|------|-------|---------|-------|
| Desktop | > 992px | 4 | Full layout, horizontal nav |
| Tablet | 768–992px | 2 | Condensed layout, horizontal nav |
| Mobile | < 768px | 1 | Stacked layout, hamburger nav |
| Feature pivot | 650px | — | FeatureSection switches from grid → carousel |

---

## Grid Patterns

### Product Grid
```
Desktop:  [  1  ][  2  ][  3  ][  4  ]
Tablet:   [  1  ][  2  ]
          [  3  ][  4  ]
Mobile:   [  1  ]
          [  2  ]
          ...
```

### Feature Grid
```
Desktop (≥ 650px):  [  1  ][  2  ][  3  ][  4  ]
Mobile  (< 650px):  ← [ carousel swipe ] →
```

### Testimonial Grid
```
Desktop:  [  1  ][  2  ][  3  ]
Tablet:   [  1  ][  2  ]
          [  3  ]
Mobile:   [  1  ]
          [  2  ]
          ...
```

### Masonry Gallery
```
Desktop:  4 columns, 0–6px gap
Tablet:   2 columns
Mobile:   1 column
```

### Two-Column Split
```
Desktop:  [ Content 50% ][ Image 50% ]
Mobile:   [ Content 100% ]
          [ Image 100%  ]
```

---

## Hero Layout

```
┌──────────────────────────────────────────────┐
│  Full viewport (100vh / 45-50vh mobile)      │
│                                              │
│  <picture> background (absolute, cover)      │
│  + rgba(0,0,0,0.4) overlay                   │
│                                              │
│                                              │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Heading (Special Gothic Condensed)  │    │
│  │  Subtext + CTA buttons              │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

- Content wrapper: `display: flex; flex-direction: column; justify-content: flex-end`
- Hero padding: 70px horizontal, 200px top, 60px bottom (desktop)
- Mobile: 28px padding, reduced height

---

## Page Layout Structure

Every page follows this skeleton:

```
<Header />  ← sticky, z-index top
<main>
  <Hero />  ← full-viewport banner
  <Section /> ← max-width 1320px, centered
  <Section /> ← alternating bg: primary / secondary
  ...
</main>
<Footer />
<TrueFooter />
```

### Section Spacing
- Vertical padding between sections: `48–64px` (desktop), `32–48px` (mobile)
- Alternating background colors: `--brand-bg-primary` and `--brand-bg-secondary`

---

## Z-Index Scale

| Layer | Usage |
|-------|-------|
| Header / sticky nav | Highest |
| Modal overlays | Above content |
| Lightbox | Above modal |
| Tooltip / popover | Above lightbox |
| Content | Base level |
