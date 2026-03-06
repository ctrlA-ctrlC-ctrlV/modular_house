# Garden Room Page - Wireframe

## Page Overview

The redesigned `/garden-room` page introduces a product-line showcase structure
while maintaining the existing site's design language (serif headings, clean
whitespace, beige/white alternating backgrounds, rust-orange CTAs).

Total sections: 8 (vs current 2). Each section maps to an existing or new
UI component.

---

## Full-Page Wireframe (Desktop - 1440px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  HEADER (dark variant, overlaid on hero)                      [Menu] ☰  │
│  Logo                        Garden Room  House Extension  Contact       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ╔═══════════════════════════════════╗                  │
│                    ║                                   ║                  │
│  ┌─────────────────║──────────────────────────────────┐║                 │
│  │                 ║    SECTION 1: HERO                ║│  100vh         │
│  │   [Full-bleed   ║                                   ║│                │
│  │    background   ║                                   ║│                │
│  │    image:       ║                                   ║│                │
│  │    garden room  ║                                   ║│                │
│  │    exterior]    ║                                   ║│                │
│  │                 ║                                   ║│                │
│  │                 ║                                   ║│                │
│  │   ┌─────────────────────────────────────────┐      ║│                │
│  │   │  (eyebrow) STEEL FRAME GARDEN ROOMS     │      ║│                │
│  │   │                                         │      ║│                │
│  │   │  (h1, serif, large)                     │      ║│                │
│  │   │  Built to Last.                         │      ║│                │
│  │   │  Designed for Living.                   │      ║│                │
│  │   │                                         │      ║│                │
│  │   │  (body) From compact home offices to    │      ║│                │
│  │   │  spacious living studios — four sizes   │      ║│                │
│  │   │  engineered for every need.             │      ║│                │
│  │   │                                         │      ║│                │
│  │   │  [  Get a Free Quote  ]  (rust btn)     │      ║│                │
│  │   │  Explore Our Ranges ↓   (text link)     │      ║│                │
│  │   └─────────────────────────────────────────┘      ║│                │
│  │                                                     ║│                │
│  │              G a r d e n   R o o m                  ║│  (big ghost    │
│  │                                                     ║│   text at      │
│  └─────────────────────────────────────────────────────┘│   bottom)      │
│                    ╚═══════════════════════════════════╝                  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 2: PRODUCT RANGE OVERVIEW             bg: white                 │
│                                                                          │
│  (eyebrow, uppercase, spaced) OUR RANGE                                  │
│  (h2, serif) Choose Your Perfect Size                                    │
│  (body) Every garden room is precision-built with CNC-cut steel          │
│  framing, superior insulation, and architectural-grade finishes.         │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │              │ │              │ │              │ │              │      │
│  │  [  photo  ] │ │  [  photo  ] │ │  [  photo  ] │ │  [  photo  ] │   │
│  │              │ │              │ │              │ │              │      │
│  │  ──────────  │ │  ──────────  │ │  ──────────  │ │  ──────────  │   │
│  │  15m²        │ │  25m²        │ │  35m²        │ │  45m²        │   │
│  │  Compact     │ │  Garden      │ │  Garden      │ │  Grand       │   │
│  │  Studio      │ │  Suite       │ │  Living      │ │  Studio      │   │
│  │              │ │              │ │              │ │              │      │
│  │  Home office │ │  Office +    │ │  Guest suite │ │  Self-       │   │
│  │  Art studio  │ │  meeting rm  │ │  Teen retreat│ │  contained   │   │
│  │  Yoga room   │ │  Home gym    │ │  Rental unit │ │  apartment   │   │
│  │              │ │  ★ POPULAR   │ │              │ │              │      │
│  │              │ │              │ │ ┌─────────┐  │ │  ┌─────────┐ │   │
│  │  No planning │ │  No planning │ │ │REGISTER │  │ │  │REGISTER │ │   │
│  │  permission  │ │  permission  │ │ │INTEREST │  │ │  │INTEREST │ │   │
│  │  required    │ │  required    │ │ └─────────┘  │ │  └─────────┘ │   │
│  │              │ │              │ │ Legislation  │ │  Legislation  │   │
│  │ [Get Quote]  │ │ [Get Quote]  │ │ pending		│ │  pending     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘     │
│                                                                          │
│                    ▼ 25m² card has "Most Popular" badge                  │
│                    ▼ 35mm² & 45m² card has "Coming Soon" ribbon + 	   │
│                      "Register Interest" CTA instead of "Get Quote"      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 3: WHY STEEL FRAME?                   bg: beige (#F6F5F0)      │
│                                                                          │
│  (reuse FeatureSection component)                                        │
│                                                                          │
│  (eyebrow) WHY MODULAR HOUSE                                            │
│  (h2, serif) Engineered for                                              │
│              Performance                                                 │
│                                                                          │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────┐│
│  │   [icon]       │ │   [icon]       │ │   [icon]       │ │   [icon]   ││
│  │                │ │                │ │                │ │            ││
│  │  Precision     │ │  Rapid Build   │ │  Energy        │ │  Built     ││
│  │  Steel Frame   │ │                │ │  Efficient     │ │  to Last   ││
│  │                │ │  6-8 week      │ │                │ │            ││
│  │  CNC-cut to   │ │  typical       │ │  A-rated BER,  │ │  50+ year  ││
│  │  0.5mm. Zero  │ │  build time.   │ │  triple-glazed │ │  structural││
│  │  thermal      │ │  Minimal site  │ │  windows,      │ │  lifespan. ││
│  │  bridging.    │ │  disruption.   │ │  underfloor    │ │  No rot,   ││
│  │               │ │                │ │  heating.      │ │  no warp.  ││
│  └────────────────┘ └────────────────┘ └────────────────┘ └────────────┘│
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 4: PLANNING PERMISSION GUIDE          bg: white                 │
│                                                                          │
│  ┌──────────────────────────┬───────────────────────────────────────┐    │
│  │                          │                                       │    │
│  │  [Illustration or        │  (eyebrow) PLANNING MADE SIMPLE      │    │
│  │   infographic:           │                                       │    │
│  │   house outline with     │  (h2, serif) Do You Need             │    │
│  │   25m² highlighted       │  Planning Permission?                 │    │
│  │   and 45m² dashed]       │                                       │    │
│  │                          │  (body) Under current Irish law,      │    │
│  │                          │  garden rooms up to 25m² are exempt   │    │
│  │                          │  from planning permission when they   │    │
│  │                          │  meet certain conditions...           │    │
│  │                          │                                       │    │
│  │                          │  ✓ Up to 25m²: No permission needed   │    │
│  │                          │  ✓ Up to 45m²: Legislation pending    │    │
│  │                          │  ✓ We handle all paperwork            │    │
│  │                          │                                       │    │
│  │                          │  [Learn More About Planning →]        │    │
│  │                          │                                       │    │
│  └──────────────────────────┴───────────────────────────────────────┘    │
│                                                                          │
│  Component: TwoColumnSplitLayout (white variant)                         │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 5: GALLERY                            bg: beige (#F6F5F0)      │
│                                                                          │
│  (eyebrow) OUR WORK                                                      │
│  (h2, serif) Garden Room Projects                                        │
│  (body) Explore our portfolio of precision-built garden rooms...         │
│                                                                          │
│  ┌─────────┐ ┌──────────────────┐ ┌─────────┐                           │
│  │         │ │                  │ │         │                             │
│  │  img 1  │ │     img 2       │ │  img 3  │                             │
│  │         │ │     (tall)      │ │         │                             │
│  ├─────────┤ │                  │ ├─────────┤                             │
│  │         │ └──────────────────┘ │         │                             │
│  │  img 4  │ ┌──────────────────┐ │  img 6  │                             │
│  │         │ │     img 5       │ │         │                             │
│  └─────────┘ └──────────────────┘ └─────────┘                             │
│                                                                          │
│  Component: FullMasonryGallery (existing, expanded to 6-8 items)         │
│                                                                          │
│  [  View Full Gallery →  ]   (text link to /gallery)                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 6: TESTIMONIALS                       bg: white                 │
│                                                                          │
│  (eyebrow) WHAT OUR CLIENTS SAY                                         │
│  (h2, serif) Trusted by Homeowners                                       │
│              Across Ireland                                              │
│                                                                          │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐   │
│  │  ★★★★★             │ │  ★★★★★             │ │  ★★★★★             │   │
│  │                    │ │                    │ │                    │     │
│  │  "The quality of   │ │  "From design to   │ │  "Our garden room │   │
│  │   our garden room  │ │   completion in     │ │   is now my       │   │
│  │   exceeded all     │ │   just 7 weeks..."  │ │   favourite room  │   │
│  │   expectations..." │ │                    │ │   in the house..." │   │
│  │                    │ │  — John D.         │ │                    │     │
│  │  — Sarah M.        │ │    Blackrock       │ │  — Emma K.        │   │
│  │    Dalkey          │ │                    │ │    Malahide        │     │
│  └────────────────────┘ └────────────────────┘ └────────────────────┘   │
│                                                                          │
│  Component: TestimonialGrid (reused from Landing)                        │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 7: FAQ                                bg: beige (#F6F5F0)      │
│                                                                          │
│  (h2, serif) Frequently Asked Questions                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ▶ Do I need planning permission for a garden room in Ireland?  │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ▶ How long does it take to build a garden room?                │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ▶ What sizes of garden rooms do you offer?                     │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ▶ Are your garden rooms insulated and heated?                  │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ▶ Can I use a garden room as a home office year-round?         │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ▶ What is included in the price?                               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Component: MiniFAQs (reused from Landing) — targets FAQPage schema      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SECTION 8: CTA / CONTACT                      bg: dark overlay image   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  (h2, serif, white) Ready to Start Your                         │    │
│  │                     Garden Room Project?                         │    │
│  │                                                                  │    │
│  │  (body, white) Book a free consultation. We'll visit your       │    │
│  │  garden, discuss your needs, and provide a detailed quote.      │    │
│  │                                                                  │    │
│  │  [  Get a Free Quote  ]    [  Call Us: 01 XXX XXXX  ]           │    │
│  │   (rust button)             (outline button)                     │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Component: ContactFormWithImageBg (reused from Landing)                 │
│            OR simpler CTA banner (new lightweight component)             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  FOOTER                                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Wireframe (375px)

```
┌─────────────────────────────┐
│  HEADER        [☰ Menu]     │
├─────────────────────────────┤
│                             │
│  SEC 1: HERO (100vh)        │
│  [Full-bleed bg image]      │
│                             │
│  STEEL FRAME GARDEN ROOMS   │
│                             │
│  Built to Last.             │
│  Designed for Living.       │
│                             │
│  Four sizes engineered      │
│  for every need.            │
│                             │
│  [ Get a Free Quote ]       │
│  Explore Our Ranges ↓       │
│                             │
│    Garden Room              │
│    (ghost text, smaller)    │
│                             │
├─────────────────────────────┤
│                             │
│  SEC 2: PRODUCT RANGE       │
│                             │
│  OUR RANGE                  │
│  Choose Your Perfect Size   │
│                             │
│  ┌───────────────────────┐  │
│  │  [photo]              │  │
│  │  15m² Compact Studio  │  │
│  │  Home office, art...  │  │
│  │  No planning needed   │  │
│  │  [ Get a Quote ]      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  [photo]  ★ POPULAR   │  │
│  │  25m² Garden Suite    │  │
│  │  Office, gym, music   │  │
│  │  No planning needed   │  │
│  │  [ Get a Quote ]      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  [photo]              │  │
│  │  35m² Garden Living   │  │
│  │  Guest suite, teen... │  │
│  │  Legislation pending  │  │
│  │  [Register Interest]  │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  [photo] COMING SOON  │  │
│  │  45m² Grand Studio    │  │
│  │  Self-contained apt   │  │
│  │  Legislation pending  │  │
│  │  [Register Interest]  │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  SEC 3: WHY STEEL FRAME     │
│  (1-column stack of 4       │
│   feature cards)            │
├─────────────────────────────┤
│  SEC 4: PLANNING GUIDE      │
│  (image stacked above text) │
├─────────────────────────────┤
│  SEC 5: GALLERY              │
│  (2-column masonry)         │
├─────────────────────────────┤
│  SEC 6: TESTIMONIALS         │
│  (1 card visible, swipe)    │
├─────────────────────────────┤
│  SEC 7: FAQ                  │
│  (accordion, full width)    │
├─────────────────────────────┤
│  SEC 8: CTA BANNER           │
│  (stacked buttons)          │
├─────────────────────────────┤
│  FOOTER                      │
└─────────────────────────────┘
```

---

## Section-to-Component Mapping

| # | Section | Component | Status | bg |
|---|---------|-----------|--------|-----|
| 1 | Hero | `HeroBoldBottomText` | Existing | image overlay |
| 2 | Product Range | **`ProductRangeGrid`** | **NEW** | white |
| 3 | Why Steel Frame | `FeatureSection` | Existing | beige |
| 4 | Planning Guide | `TwoColumnSplitLayout` | Existing | white |
| 5 | Gallery | `FullMassonryGallery` | Existing | beige |
| 6 | Testimonials | `TestimonialGrid` | Existing | white |
| 7 | FAQ | `MiniFAQs` | Existing | beige |
| 8 | CTA | `ContactFormWithImageBg` | Existing | image overlay |

**Only 1 new component needed**: `ProductRangeGrid` (the product card grid).
All other sections reuse existing components from the UI library.

---

## New Component: ProductRangeGrid

### Props Interface

```typescript
interface ProductCard {
  size: string;           // "15m²"
  name: string;           // "Compact Studio"
  image: string;          // "/resource/garden-room/15m2.png"
  imageWebP?: string;
  imageAvif?: string;
  useCases: string[];     // ["Home office", "Art studio", "Yoga room"]
  planningNote: string;   // "No planning permission required"
  badge?: string;         // "Most Popular" | "Coming Soon"
  ctaText: string;        // "Get a Quote" | "Register Interest"
  ctaLink: string;        // "/contact?product=garden-room-15"
  available: boolean;     // false for 45m² (legislation pending)
}

interface ProductRangeGridProps {
  eyebrow: string;
  title: string;
  description: string;
  products: ProductCard[];
  renderLink: LinkRenderer;
}
```

### Visual Spec

- 4-column grid on desktop (1280px+)
- 2-column grid on tablet (768-1279px)
- 1-column stack on mobile (<768px)
- Card: image top, content bottom
- Badge: absolute positioned top-right corner of image
- "Coming Soon" variant: subtle opacity reduction on image, dashed border
- CTA button: rust orange for available, outline for "Register Interest"

---

## Spacing & Rhythm

| Section | Vertical Padding | Notes |
|---------|-----------------|-------|
| Hero | 0 (full viewport) | 100vh, content bottom-aligned |
| Product Range | 80px top / 80px bottom | Generous breathing room |
| Why Steel Frame | 64px top / 64px bottom | Standard section padding |
| Planning Guide | 64px top / 64px bottom | Uses TwoColumnSplitLayout internal padding |
| Gallery | 64px top / 64px bottom | Standard section padding |
| Testimonials | 64px top / 64px bottom | Standard section padding |
| FAQ | 64px top / 80px bottom | Extra bottom before final CTA |
| CTA | 80px top / 80px bottom | Generous for impact |

---

## Colour Rhythm (Alternating Backgrounds)

```
Hero        → image overlay (dark)
Product     → white
Why Steel   → beige (#F6F5F0)
Planning    → white
Gallery     → beige (#F6F5F0)
Testimonials→ white
FAQ         → beige (#F6F5F0)
CTA         → image overlay (dark)
```

The alternating white/beige pattern creates visual rhythm without
being monotonous. Dark bookends (hero + CTA) frame the page.
