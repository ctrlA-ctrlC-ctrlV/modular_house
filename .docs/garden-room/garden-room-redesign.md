# Garden Room Page Redesign — Wireframe & Design Specification

**Author:** Product Design
**Date:** 2026-03-02
**Route:** `/garden-room`
**Goal:** Redesign the garden room product page from a 2-section stub into a conversion-optimised, SEO-rich landing page that competes for page-1 ranking on "garden room Ireland" while staying true to the existing Modular House design system.

---

## 1. Competitor Landscape Summary

| Dimension | Shomera | GardenRooms.ie | MyGardenRoom | Shanette |
|---|---|---|---|---|
| Sections | 14 | 12 | 7 | 9 |
| Word count | ~2,000 | ~1,000 | ~500 | ~1,000 |
| Pricing shown | Per-model | Per-range | None | Download |
| FAQ on page | CTA to FAQ page | No | No | No |
| Testimonials | 3 (slider) | 3 (case studies) | None | 5 (slider) |
| Schema types | 6 (incl. Video) | 4 | 0 | 4 |
| Contact form | External link | On-page | Off-page | On-page |
| Gallery images | 20+ | 6 | 5 | 20+ |

**Key SEO gaps across all competitors:**
- None use `Product`, `FAQPage`, or `LocalBusiness` schema on their garden room pages.
- None have structured FAQ content with accordion markup for rich snippets.
- Thin internal linking; few contextual cross-links.

**Our opportunity:** Combine the content depth of Shomera, the social proof of GardenRooms.ie, the visual clarity of MyGardenRoom, and the specification detail of Shanette — with superior structured data that none of them implement.

---

## 2. Design Principles

1. **Content-first SEO** — Target 1,500–2,000 words of indexable body text, naturally woven into sections.
2. **Design-system native** — Use only existing Modular House UI components (with minor extensions where noted). No new visual language.
3. **Conversion funnel** — Three CTA touchpoints: hero, mid-page, and bottom. Progressive disclosure of commitment (learn → explore → enquire).
4. **Mobile-first** — All sections stack cleanly on mobile. Gallery and testimonials remain swipeable.
5. **Schema superiority** — Implement `Product`, `FAQPage`, `BreadcrumbList`, `WebPage`, and `LocalBusiness` — schemas no competitor currently uses.

---

## 3. Page Structure — Section-by-Section Wireframe

### Header
- `variant: 'dark'`, `positionOver: true` (transparent over hero, white logo + links)

---

### Section 1 — Hero
**Component:** `HeroBoldBottomText`
**Scroll ID:** `#gr-hero`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  (full-viewport background image — garden room exterior  │
│   at golden hour, modern steel-frame with cedar cladding │
│   in a lush Irish garden)                                │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  GARDEN ROOM              (large display text, bg)  │  │
│  │                                                     │  │
│  │  Your private retreat,                              │  │
│  │  engineered for Irish weather.                      │  │
│  │                                                     │  │
│  │  [Get a Free Quote]  (btn-brand-primary)            │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Content notes:**

- H1 is embedded in `titleLine1`/`titleLine2`. Visually: two-line statement.
- `bigText`: "Garden Room" — large decorative background text.
- CTA links to `#gr-contact` (scroll to on-page form).
- Background image: existing `/resource/garden_room_hero.png` with WebP/AVIF variants.

---

### Section 2 — Value Proposition (Why a Garden Room?)
**Component:** `TwoColumnSplitLayout`
**Background:** `beige` (`#F6F5F0`)
**Scroll ID:** `#gr-why`

```
┌──────────────────────────────────────────────────────────┐
│  GARDEN ROOMS               (eyebrow, text-eyebrow)     │
│                                                          │
│  ┌───────────────────────┐  ┌──────────────────────────┐ │
│  │                       │  │                          │ │
│  │  (image: bright       │  │  (image: interior shot   │ │
│  │   exterior, cedar     │  │   — desk, screen, plant, │ │
│  │   cladding, sliding   │  │   natural light from     │ │
│  │   doors open)         │  │   full-height glazing)   │ │
│  │                       │  │                          │ │
│  └───────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  More Than a Garden Room — Your Space, Your Way          │
│  (H2, font-serif)                                        │
│                                                          │
│  Whether you need a quiet home office, a sunlit yoga     │
│  studio, or a self-contained guest suite, our steel-     │
│  frame garden rooms are built to last and designed to    │
│  blend seamlessly with your home. Every unit is fully    │
│  insulated, triple-glazed, and finished to the same      │
│  standard as a permanent dwelling.                       │
│                                                          │
│  No planning permission required for most sizes under    │
│  25 m². Installed in as little as 4–6 weeks.             │
│                                                          │
│  [View Our Work]          [Request a Quote]              │
│  (btn-brand-secondary)    (btn-brand-primary)            │
└──────────────────────────────────────────────────────────┘
```

**SEO keywords targeted:** "garden room Ireland", "home office garden room", "no planning permission", "fully insulated", "steel frame".

---

### Section 3 — Features & Specifications
**Component:** `FeatureSection`
**Background:** `white`
**Scroll ID:** `#gr-features`

```
┌──────────────────────────────────────────────────────────┐
│  BUILT TO LAST             (eyebrow)                     │
│                                                          │
│  What Sets Our             │  Every Modular House garden │
│  Garden Rooms Apart  (H2)  │  room is precision-         │
│                            │  engineered in Dublin using  │
│                            │  100mm galvanised steel and  │
│                            │  composite panel technology. │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │
│  │ icon │  │ icon │  │ icon │  │ icon │                 │
│  │      │  │      │  │      │  │      │                 │
│  │Steel │  │Triple│  │Full  │  │10-Yr │                 │
│  │Frame │  │Glazed│  │Elec- │  │Struct│                 │
│  │      │  │uPVC  │  │trical│  │ural  │                 │
│  │100mm │  │A-    │  │Wiring│  │Guara-│                 │
│  │galv. │  │rated │  │& LED │  │ntee  │                 │
│  │steel │  │insu- │  │light-│  │      │                 │
│  │frame │  │lation│  │ing   │  │      │                 │
│  └──────┘  └──────┘  └──────┘  └──────┘                 │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                 │
│  │ icon │  │ icon │  │ icon │  │ icon │                 │
│  │      │  │      │  │      │  │      │                 │
│  │Compo-│  │Off-  │  │No    │  │Custom│                 │
│  │site  │  │Site  │  │Plan- │  │Sizes │                 │
│  │Clad- │  │Manu- │  │ning  │  │      │                 │
│  │ding  │  │fact- │  │Perm- │  │From  │                 │
│  │      │  │ured  │  │ission│  │3m×3m │                 │
│  │      │  │      │  │<25m² │  │to 8m │                 │
│  └──────┘  └──────┘  └──────┘  └──────┘                 │
└──────────────────────────────────────────────────────────┘
```

**Content notes:**
- 8 features in a 4×2 grid (FeatureSection supports arbitrary counts).
- Each feature: icon (from `CustomIcons`), title (H3), 1–2 sentence description.
- Keyword-rich descriptions — "A-rated insulation", "composite cladding", "off-site manufactured", "no planning permission under 25 m²".

---

### Section 4 — Product Ranges (Use Cases)
**Component:** `TwoColumnSplitLayout` (×2 or ×3, alternating)
**Background:** alternating `white` / `beige`
**Scroll ID:** `#gr-ranges`

This section presents garden rooms by **use case** rather than model number — differentiating from competitors who lead with dimensions.

```
┌──────────────────────────────────────────────────────────┐
│  (beige background)                                      │
│                                                          │
│  HOME OFFICE                  (eyebrow)                  │
│                                                          │
│  The Garden Office            │  ┌──────────────────────┐│
│  That Works As Hard           │  │                      ││
│  As You Do  (H2)              │  │  (image: person at   ││
│                               │  │   standing desk in   ││
│  A dedicated workspace        │  │   bright garden      ││
│  steps from your back door.   │  │   room office)       ││
│  Our garden offices come      │  │                      ││
│  wired for high-speed         │  └──────────────────────┘│
│  broadband, with USB          │                          │
│  charging points, LED         │  ┌──────────────────────┐│
│  task lighting, and           │  │                      ││
│  climate control.             │  │  (image: exterior    ││
│                               │  │   shot showing       ││
│  Popular sizes:               │  │   garden context)    ││
│  3.6m × 3.0m from €35,000    │  │                      ││
│  4.2m × 3.6m from €42,000    │  └──────────────────────┘│
│                               │                          │
│  [Enquire Now]  [View Gallery]│                          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  (white background)                                      │
│                                                          │
│  ┌──────────────────────┐  │  GYM & WELLNESS             │
│  │                      │  │                              │
│  │  (image: home gym    │  │  Your Personal Gym,          │
│  │   with equipment,    │  │  Rain or Shine  (H2)         │
│  │   rubber flooring)   │  │                              │
│  │                      │  │  Heavy-duty composite floor,  │
│  └──────────────────────┘  │  reinforced for equipment.    │
│                            │  Ventilation system and       │
│  ┌──────────────────────┐  │  moisture-resistant walls     │
│  │                      │  │  come standard.               │
│  │  (image: yoga /      │  │                              │
│  │   pilates studio)    │  │  Popular sizes:               │
│  │                      │  │  5.4m × 3.6m from €48,000    │
│  └──────────────────────┘  │  6.6m × 3.6m from €55,000    │
│                            │                              │
│                            │  [Enquire Now]  [View Gallery]│
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  (beige background)                                      │
│                                                          │
│  STUDIO & CREATIVE SPACE     (eyebrow)                   │
│                                                          │
│  Space to Create,             │  ┌──────────────────────┐│
│  Space to Breathe  (H2)       │  │                      ││
│                               │  │  (image: art /       ││
│  Soundproofed, naturally      │  │   music studio)      ││
│  lit, and designed for        │  │                      ││
│  creative flow. Ideal for     │  └──────────────────────┘│
│  artists, musicians,          │                          │
│  therapists, and beauty       │  ┌──────────────────────┐│
│  professionals working        │  │                      ││
│  from home.                   │  │  (image: therapy     ││
│                               │  │   room / salon)      ││
│  Popular sizes:               │  │                      ││
│  4.8m × 3.6m from €45,000     │  └──────────────────────┘│
│                               │                          │
│  [Enquire Now]  [View Gallery]│                          │
└──────────────────────────────────────────────────────────┘
```

**SEO rationale:** Use-case sections generate natural keyword clusters ("garden office Ireland", "home gym garden room", "garden studio Dublin") without keyword stuffing. Each use case has ~80–120 words of unique descriptive copy. Pricing transparency signals E-E-A-T and enables `Product` schema `AggregateOffer`.

---

### Section 5 — Gallery
**Component:** `FullMassonryGallery`
**Background:** `white`
**Scroll ID:** `#gr-gallery`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Garden Room Projects  (H2)                              │
│  A selection of recently completed installations         │
│  across Dublin and surrounding counties.                 │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐                        │
│  │        │ │        │ │        │                        │
│  │ img 1  │ │ img 2  │ │ img 3  │                        │
│  │        │ │        │ │        │                        │
│  │        │ └────────┘ │        │                        │
│  │        │ ┌────────┐ └────────┘                        │
│  └────────┘ │        │ ┌────────┐                        │
│  ┌────────┐ │ img 4  │ │        │                        │
│  │        │ │        │ │ img 6  │                        │
│  │ img 5  │ └────────┘ │        │                        │
│  │        │ ┌────────┐ │        │                        │
│  └────────┘ │ img 7  │ └────────┘                        │
│  ┌────────┐ └────────┘ ┌────────┐                        │
│  │ img 8  │ ┌────────┐ │ img 10 │                        │
│  └────────┘ │ img 9  │ └────────┘                        │
│             └────────┘                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Content notes:**
- Expand from current 5 images to **10–12** images.
- Each image should have descriptive `alt` text containing keywords (e.g., "Cedar-clad garden office in Blackrock, Dublin with full-height glazing").
- Mix of: exterior establishing shots, interior detail shots, construction-in-progress shots, and lifestyle/in-use shots.
- Lightbox on click (existing component behaviour).
- Each `GalleryItem` includes `title` (used in lightbox caption) and `category` (e.g., "Home Office", "Gym", "Studio").

---

### Section 6 — Testimonials & Social Proof
**Component:** `TestimonialGrid`
**Background:** `beige`
**Scroll ID:** `#gr-testimonials`

```
┌──────────────────────────────────────────────────────────┐
│  (beige background)                                      │
│                                                          │
│  WHAT OUR CLIENTS SAY        (eyebrow)                   │
│  Real Reviews From Real Homeowners  (H2)                 │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ ★★★★★   │ │ ★★★★★   │ │ ★★★★★   │ │ ★★★★★   │    │
│  │          │ │          │ │          │ │          │    │
│  │ "We use  │ │ "The     │ │ "From    │ │ "Our     │    │
│  │  our     │ │  quality │ │  first   │ │  garden  │    │
│  │  garden  │ │  is      │ │  contact │ │  gym is  │    │
│  │  office  │ │  amazing │ │  to      │ │  better  │    │
│  │  every   │ │  ..."    │ │  handov- │ │  than    │    │
│  │  day..." │ │          │ │  er..."  │ │  any..." │    │
│  │          │ │ — Sarah  │ │          │ │          │    │
│  │ — John   │ │   D.     │ │ — Mark   │ │ — Lisa   │    │
│  │   & Anna │ │   Malah- │ │   O'B.   │ │   K.     │    │
│  │   Howth  │ │   ide    │ │   Naas   │ │   Dún L. │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                          │
│              ● ○ ○             (dot pagination)          │
└──────────────────────────────────────────────────────────┘
```

**Content notes:**
- 4–6 testimonials with real client names, locations (Dublin suburbs / commuter belt), and star ratings.
- Horizontal scroll carousel (existing component behaviour).
- Each testimonial mentions a specific use case (office, gym, studio) to reinforce keyword relevance.
- If Google/Trustpilot reviews are available, add a "View all reviews on Google" link beneath.

---

### Section 7 — FAQ (Accordion)
**Component:** `MiniFAQs`
**Background:** `white`
**Scroll ID:** `#gr-faq`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Garden                     (large decorative serif)    │
│   Rooms.                                                 │
│                                                          │
│  ─────────────────────────────────────────────────────── │
│  01  │  │  Do I need planning permission for a           │
│      │  │  garden room in Ireland?                       │
│      │  │                                                │
│      │  │  Most garden rooms under 25 m² are exempt      │
│      │  │  from planning permission under S.I. No.       │
│      │  │  600 of 2001. The structure must be at the     │
│      │  │  rear of the house, not exceed 4 m in          │
│      │  │  height (3 m if within 2 m of the              │
│      │  │  boundary), and the total site coverage        │
│      │  │  of extensions must not exceed 25 m².          │
│      │  │  We handle all compliance checks for you.      │
│  ─────────────────────────────────────────────────────── │
│  02  │  │  How long does it take to build and            │
│      │  │  install a garden room?                        │
│      │  │                                                │
│      │  │  Our steel-frame garden rooms are               │
│      │  │  manufactured off-site in 3–4 weeks.           │
│      │  │  On-site installation typically takes           │
│      │  │  3–5 working days, depending on ground          │
│      │  │  preparation and electrical connection.         │
│  ─────────────────────────────────────────────────────── │
│  03  │  │  How much does a garden room cost in           │
│      │  │  Ireland?                                      │
│      │  │                                                │
│      │  │  Our garden rooms start from €35,000 for       │
│      │  │  a 3 m × 3 m unit and range up to €110,000    │
│      │  │  for larger bespoke builds. Price depends      │
│      │  │  on size, cladding, glazing, and interior      │
│      │  │  finish. Request a free quote for an exact     │
│      │  │  price tailored to your requirements.          │
│  ─────────────────────────────────────────────────────── │
│  04  │  │  Are your garden rooms insulated for           │
│      │  │  year-round use?                               │
│      │  │                                                │
│      │  │  Yes. Every garden room uses A-rated            │
│      │  │  composite insulation panels and uPVC           │
│      │  │  triple-glazed windows, achieving a BER         │
│      │  │  rating suitable for year-round                 │
│      │  │  occupation — even in Irish winters.            │
│  ─────────────────────────────────────────────────────── │
│  05  │  │  Do you provide electrical and plumbing        │
│      │  │  connections?                                   │
│      │  │                                                │
│      │  │  Full electrical wiring (lighting, sockets,     │
│      │  │  USB charging, consumer unit) is included       │
│      │  │  as standard. Plumbing can be added for         │
│      │  │  kitchenette or WC at additional cost.          │
│  ─────────────────────────────────────────────────────── │
│  06  │  │  What areas do you serve?                      │
│      │  │                                                │
│      │  │  We serve Dublin and all surrounding            │
│      │  │  counties including Meath, Kildare,             │
│      │  │  Wicklow, Louth, and Westmeath. Contact         │
│      │  │  us to check availability in your area.         │
│  ─────────────────────────────────────────────────────── │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**SEO rationale:**
- These 6 FAQs target high-volume "People Also Ask" queries for "garden room Ireland".
- Each answer is 40–80 words — long enough for featured snippet eligibility, short enough to stay scannable.
- **FAQPage schema** will be added to `routes-metadata.ts` — no competitor currently has this on their garden room page.

---

### Section 8 — Contact / Enquiry Form (CTA)
**Component:** `ContactFormWithImageBg`
**Background:** full-bleed image
**Scroll ID:** `#gr-contact`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  (full-width background image — garden room at dusk      │
│   with warm interior light glowing through glass doors)  │
│                                                          │
│                         ┌──────────────────────────────┐ │
│                         │  Get a Free Quote             │ │
│                         │                              │ │
│                         │  First name  [__________]    │ │
│                         │  Last name   [__________]    │ │
│                         │  Email       [__________]    │ │
│                         │  Phone       [__________]    │ │
│                         │  Product     [Garden Room ▾] │ │
│                         │  Message     [__________]    │ │
│                         │              [__________]    │ │
│                         │                              │ │
│                         │  ☑ I consent to GDPR...      │ │
│                         │                              │ │
│                         │  [Send Enquiry]              │ │
│                         │   (btn-brand-primary)        │ │
│                         └──────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Content notes:**
- Re-uses the existing `ContactFormWithImageBg` component unchanged.
- `productType` dropdown should default to "Garden Room" (pre-selected since user is on this page).
- Background image: a different shot from the hero — interior warmth visible through glazing at dusk.
- H2: "Get a Free Quote" (targets "garden room quote Ireland").

---

### Footer
- Standard site footer (already handled by `TemplateLayout`).

---

## 4. Structured Data / Schema Strategy

Add the following to the garden room route in `routes-metadata.ts`:

### 4.1 FAQPage Schema (NEW — no competitor has this)

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Do I need planning permission for a garden room in Ireland?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most garden rooms under 25 m² are exempt from planning permission under S.I. No. 600 of 2001..."
      }
    }
  ]
}
```

### 4.2 Product Schema (ENHANCE existing)

The current route already has `Product` with `AggregateOffer`. Enhance with:
- `brand`: `{ "@type": "Brand", "name": "Modular House" }`
- `aggregateRating` (once Google reviews are aggregated)
- `offers` array with individual use-case offers for richer snippet display

### 4.3 BreadcrumbList (already present via generatePageSchema)

Verify renders as: `Home > Garden Rooms`

### 4.4 LocalBusiness (add to @graph)

```json
{
  "@type": "HomeAndConstructionBusiness",
  "name": "Modular House",
  "address": { "@type": "PostalAddress", "addressLocality": "Dublin", "addressCountry": "IE" },
  "telephone": "+353-...",
  "priceRange": "€€€"
}
```

---

## 5. On-Page SEO Checklist

| Element | Current | Proposed |
|---|---|---|
| Title tag | "Garden Rooms & Studios \| Modular House" | "Garden Rooms Ireland \| Bespoke Steel-Frame Garden Rooms \| Modular House" |
| Meta description | Generic 1-liner | "Custom-built steel-frame garden rooms in Dublin. Fully insulated, no planning permission required under 25 m². Home offices, gyms & studios from €35,000. Free quote." (155 chars) |
| H1 | Embedded in hero decorative text | Explicit H1 in hero: "Your private retreat, engineered for Irish weather." |
| H2 count | 0 | 6 (one per section: Why, Features, each use-case, Gallery, Testimonials, FAQ, Contact) |
| Word count | ~50 | ~1,800 |
| Internal links | 1 (CTA to /contact) | 6+ (contact, gallery anchors, house-extension cross-link, blog posts) |
| Image alt text | Generic | Keyword-rich, location-specific |
| FAQ markup | None | 6 Q&As with FAQPage schema |
| Canonical | Set | Keep |
| OG/Twitter | Set via TemplateLayout | Keep — already covered |

---

## 6. Internal Linking Strategy

Add contextual links within body copy to:

| Target | Anchor text | Placement |
|---|---|---|
| `/house-extension` | "house extensions" | Value prop section (cross-sell) |
| `/contact` | "get in touch", "request a quote" | Multiple CTAs |
| `/garden-room#gr-gallery` | "view our work" | Value prop CTA |
| `/garden-room#gr-faq` | "frequently asked questions" | Intro copy |
| Future: `/blog/planning-permission-garden-rooms` | "planning permission guide" | FAQ answer #1 |
| Future: `/blog/garden-room-cost-ireland` | "garden room pricing guide" | FAQ answer #3 |

---

## 7. Content Guidelines

### Tone of voice
- Confident but not salesy. Professional, warm, Irish-market aware.
- Use "we" and "our" — first person plural. Never "I".
- Address the reader as "you" / "your".
- Avoid jargon; explain technical terms in plain language.

### Keyword density targets (natural weaving, not stuffing)
- "garden room" / "garden rooms": 12–18 occurrences across the page
- "Ireland" / "Dublin": 4–6 occurrences
- "home office" / "garden office": 3–4 occurrences
- "no planning permission": 2–3 occurrences
- "insulated" / "insulation": 3–4 occurrences
- "steel frame": 2–3 occurrences

---

## 8. Component Requirements & Changes

### Existing components — used as-is:
- `HeroBoldBottomText` — hero section
- `FeatureSection` — features grid
- `FullMassonryGallery` — project gallery
- `TestimonialGrid` — testimonials carousel
- `MiniFAQs` — FAQ section
- `ContactFormWithImageBg` — contact form

### Existing components — with prop adjustments:
- `TwoColumnSplitLayout` — used 3× for use-case sections (need real images + copy)

### New components needed: **None**
The entire page can be built using the existing component library. This is a content and SEO play, not a component engineering exercise.

### Data needed before implementation:
1. **10–12 high-quality garden room photos** (mix of exterior/interior/lifestyle)
2. **4–6 real client testimonials** with names, locations, and star ratings
3. **Confirmed pricing** for each size/use-case range
4. **Contact phone number** for LocalBusiness schema
5. **Blog content** for internal linking targets (can be added later)

---

## 9. Mobile Responsive Behaviour

All components already handle mobile gracefully via the existing CSS:

| Section | Desktop | Mobile |
|---|---|---|
| Hero | Full viewport, text overlay | Same, text scales down |
| TwoColumnSplitLayout | Side-by-side images + text | Stacks: images on top, text below |
| FeatureSection | 4-column grid | 2-column → 1-column |
| Gallery | 3-column masonry | 2-column → 1-column |
| TestimonialGrid | 4 visible cards | 1 card, swipe |
| MiniFAQs | 3-column (number, divider, content) | Stacks vertically |
| ContactFormWithImageBg | Image bg + right-aligned form | Form full-width over dimmed image |

---

## 10. Performance Considerations

- All images served as AVIF → WebP → PNG/JPG via `OptimizedImage` component.
- Hero image uses `priority` prop (eager load, fetchpriority=high).
- All below-fold images use `loading="lazy"`.
- No new JS bundles required — all components already in the UI package.
- Target: LCP < 2.5s, CLS < 0.1, FID < 100ms (aligned with Core Web Vitals).

---

## 11. Success Metrics

| Metric | Current | Target (3 months) |
|---|---|---|
| Google rank "garden room Ireland" | Not ranked | Top 20 |
| Google rank "garden room Dublin" | Not ranked | Top 10 |
| Page word count | ~50 | ~1,800 |
| Time on page | < 15s (bounce) | > 90s |
| Enquiry conversion rate | 0% (no on-page form) | 2–4% |
| Core Web Vitals | Pass | Pass (maintain) |
| Structured data types | 3 | 6 |
| FAQ rich snippet eligibility | No | Yes |

---

## Appendix A — Full Section Map (At a Glance)

```
┌────────────────────────────────────────────┐
│  1. HERO — HeroBoldBottomText              │  H1 + CTA
│     bg: full-bleed image                   │
├────────────────────────────────────────────┤
│  2. VALUE PROP — TwoColumnSplitLayout      │  H2 + 2 images + copy
│     bg: beige                              │
├────────────────────────────────────────────┤
│  3. FEATURES — FeatureSection              │  H2 + 8 feature cards
│     bg: white                              │
├────────────────────────────────────────────┤
│  4a. USE CASE: Office — TwoColumnSplit     │  H2 + pricing
│     bg: beige                              │
├────────────────────────────────────────────┤
│  4b. USE CASE: Gym — TwoColumnSplit        │  H2 + pricing
│     bg: white                              │
├────────────────────────────────────────────┤
│  4c. USE CASE: Studio — TwoColumnSplit     │  H2 + pricing
│     bg: beige                              │
├────────────────────────────────────────────┤
│  5. GALLERY — FullMassonryGallery          │  H2 + 10-12 images
│     bg: white                              │
├────────────────────────────────────────────┤
│  6. TESTIMONIALS — TestimonialGrid         │  H2 + 4-6 reviews
│     bg: beige                              │
├────────────────────────────────────────────┤
│  7. FAQ — MiniFAQs                         │  H2 + 6 Q&As
│     bg: white                              │  + FAQPage schema
├────────────────────────────────────────────┤
│  8. CONTACT — ContactFormWithImageBg       │  H2 + form
│     bg: full-bleed image                   │
├────────────────────────────────────────────┤
│  FOOTER (via TemplateLayout)               │
└────────────────────────────────────────────┘
```

Total sections: **8** (vs current 2)
Estimated word count: **~1,800** (vs current ~50)
Schema types: **6** (vs current 3)
CTAs: **7** (vs current 1)
