# Data Model: Garden Room Page Redesign

**Feature**: 008-garden-room-redesign
**Date**: 2026-03-03

## Entities

### ProductCard

Represents a garden room size option displayed in the Product Range section.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| size | string | Yes | Display size (e.g., "15m²") |
| name | string | Yes | Product name (e.g., "Compact Studio") |
| image | string | Yes | Primary image path (PNG/JPEG fallback) |
| imageWebP | string | No | WebP optimized variant |
| imageAvif | string | No | AVIF optimized variant |
| useCases | string[] | Yes | List of typical use cases (e.g., ["Home office", "Art studio"]) |
| planningNote | string | Yes | Planning permission status text |
| badge | string | No | Badge text ("Most Popular", "Coming Soon", or none) |
| ctaText | string | Yes | Button label ("Get a Quote" or "Register Interest") |
| ctaLink | string | Yes | Navigation target with query params |
| available | boolean | Yes | Whether product is currently orderable |

**Validation rules**:
- `size` must be non-empty
- `useCases` must have at least 1 item
- `ctaLink` must start with "/"
- When `available` is false, `badge` should be "Coming Soon" and `ctaText` should be "Register Interest"

**Instances** (4 total):

| size | name | badge | available | ctaLink |
|------|------|-------|-----------|---------|
| 15m² | Compact Studio | — | true | /contact?product=garden-room-15 |
| 25m² | Garden Suite | Most Popular | true | /contact?product=garden-room-25 |
| 35m² | Garden Living | Coming Soon | false | /contact?product=garden-room-35&interest=true |
| 45m² | Grand Studio | Coming Soon | false | /contact?product=garden-room-45&interest=true |

---

### FAQItem (AccordionFAQItem)

Represents a question-answer pair in the FAQ section. Used both for the AccordionFAQ component rendering and FAQPage schema generation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier for ARIA attributes (e.g., "faq-1") |
| number | string | Yes | Display number ("01" through "06") |
| title | string | Yes | Question text |
| description | string | Yes | Answer text |

**Instances** (6 total):

| # | Question topic |
|---|---------------|
| 01 | Planning permission requirements in Ireland |
| 02 | Build timeline |
| 03 | Available sizes |
| 04 | Insulation and heating |
| 05 | Year-round use as home office |
| 06 | What's included in the price |

**Dual use**: The same FAQ data array feeds both the AccordionFAQ component props and the FAQPage JSON-LD schema generation in routes-metadata.ts.

---

### TestimonialItem

Represents a customer testimonial. Uses placeholder data initially.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| text | string | Yes | Quote text |
| authorName | string | Yes | Customer name (first name + last initial) |
| authorLocation | string | Yes | Dublin-area location |
| authorImageSrc | string | Yes | Avatar image path |
| rating | number | No | Star rating 1-5 (defaults to 5) |

**Note**: Placeholder testimonials will be used at launch. The component accepts an array, so swapping in real testimonials requires only data changes.

---

### FeatureItem

Represents a USP in the "Why Steel Frame" section.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| icon | ReactNode | Yes | SVG icon from CustomIcons |
| title | string | Yes | Feature title |
| description | string | Yes | Feature description |

**Instances** (4 total):
1. Precision Steel Frame — CNC-cut, zero thermal bridging
2. Rapid Build — 6-8 week timeline, minimal disruption
3. Energy Efficient — A-rated BER, triple-glazed, underfloor heating
4. Built to Last — 50+ year lifespan, no rot/warp

---

## Relationships

```
GardenRoom Page
├── uses → ProductCard[] (4 items)
├── uses → FeatureItem[] (4 items)
├── uses → FAQItem[] (6 items) ──→ also feeds FAQPage schema
├── uses → TestimonialItem[] (2-3 items)
├── uses → GalleryItem[] (6-8 items, existing interface)
└── references → routes-metadata.ts (SEO config)
         ├── Product schema (4 offers mapped from ProductCard[])
         ├── FAQPage schema (mapped from FAQItem[])
         ├── BreadcrumbList (Home > Garden Room)
         └── WebPage schema
```

All data is static (defined as constants in the page component or shared data files). No runtime data fetching required.
