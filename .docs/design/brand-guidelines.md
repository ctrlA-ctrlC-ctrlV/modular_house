# Brand Guidelines

---

## Company Profile

- **Name**: Modular House
- **Location**: Dublin, Ireland
- **Industry**: Steel-frame garden rooms and house extensions
- **Positioning**: Premium, modern construction with a warm, trustworthy tone

---

## Logo

| Asset | Path | Size |
|-------|------|------|
| SVG (primary) | `/m.svg` | Vector (scalable) |
| PNG (favicon/fallback) | `/m.png` | 96 × 96 px |

### Logo Usage Rules
- **Header**: 48px height, auto width
- **Dark backgrounds**: Apply `filter: brightness(0) invert(1)` to make logo white
- **Light backgrounds**: Use default dark logo
- **Clear space**: Maintain at least 8px (1 spacing unit) around the logo
- **Minimum size**: 32px height

### Favicon
- Primary: SVG (`/m.svg`)
- Fallback: PNG (`/m.png`)

---

## Color Identity

The brand palette is rooted in the materials of construction:

| Association | Color | Hex |
|-------------|-------|-----|
| **Timber / Warmth** | Copper Brown | `#B55329` |
| **Steel / Strength** | Near-Black | `#1A1714` |
| **Natural Light** | Warm Beige | `#F6F5F0` |
| **Clean Finish** | Near-White | `#FEFEFE` |

### Primary Accent
`#B55329` is used for all CTAs, links, and interactive elements. It evokes warm timber and premium craftsmanship.

### Dark Theme
`#1A1714` is used in footer sections and dark backgrounds, evoking structural steel.

---

## Typography Voice

### Headings: Special Gothic Condensed One
- Serif/display typeface with an editorial, architectural feel
- Used for hero text, section headings, and display moments
- Always paired with tight line-height (`1.2`) and tight tracking (`-0.02em`)

### Body: Inter
- Clean, highly legible sans-serif
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold)
- Standard line-height: `1.5` for body text

### Eyebrow Pattern
- Font: Inter
- Weight: 500–600
- Size: `0.75rem`
- Transform: `uppercase`
- Letter-spacing: `0.12em`
- Used above section titles to categorize content (e.g., "OUR RANGE", "WHY STEEL FRAME")

---

## Photography Style

### Hero Images
- Full-viewport background images of finished projects
- Rendered or photographed in natural daylight
- Always overlaid with `rgba(0,0,0,0.4)` for text contrast
- Served in AVIF → WebP → JPEG/PNG fallback chain

### Product Images
- Clean, well-lit shots on neutral backgrounds
- Consistent aspect ratios within grids
- Optimized via Vite-imagetools pipeline

### Gallery Images
- Mix of exterior and interior shots
- Masonry layout showcases varied aspect ratios
- Click-to-lightbox interaction

---

## Tone of Voice

| Attribute | Description |
|-----------|-------------|
| **Confident** | We know our craft. Statements are direct and assured. |
| **Warm** | Approachable language, not corporate jargon. |
| **Trustworthy** | Facts over hype. Warranty and planning info presented clearly. |
| **Premium** | Language reflects quality materials and expert construction. |

### Writing Examples
- "Steel frame garden rooms engineered for Irish weather"
- "Built to last with premium steel framework"
- Not: "Amazing incredible luxury garden rooms!!!"

---

## Brand Gradient

The signature gradient blends the deep foundation brown with the primary copper:

```css
linear-gradient(215deg, #4F2412 0%, #B55329 100%)
```

Used for hero overlays, CTA backgrounds, and decorative accents.
