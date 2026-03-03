# Garden Room Page - Content Strategy

## Target Keywords

### Primary
- "garden room Ireland"
- "garden room Dublin"
- "garden rooms"

### Secondary (Long-tail)
- "garden room planning permission Ireland"
- "garden room home office Ireland"
- "steel frame garden room"
- "25m garden room no planning permission"
- "garden room prices Ireland"

### Emerging (Legislation-related)
- "45m garden room Ireland"
- "garden room planning permission 2026"
- "exempt development garden room Ireland"

---

## Page Title & Meta

- **Title**: "Garden Rooms Ireland | Steel Frame Garden Rooms from 15m² to 45m² | Modular House"
- **Description**: "Premium steel-frame garden rooms in 15m², 25m², 35m² and 45m² sizes. No planning permission needed up to 25m². Designed & built in Dublin. Get a free quote today."

---

## Content Sections & Copy Direction

### 1. Hero Section
- **Headline**: "Steel Frame Garden Rooms Built to Last"
- **Subline**: "From compact home offices to spacious living studios — four sizes engineered for every need."
- **CTA**: "Get a Free Quote" → /contact

### 2. Product Range Overview (4 Product Cards)
Section introduces the size-based product line. Each card shows:
- Size (m²), key dimensions, typical use case
- Starting price indicator (e.g., "From €XX,XXX")
- 1 hero image per size
- CTA: "Learn More" (scrolls to detail) or "Get a Quote"

**Copy per size:**

| Size | Name | Use Cases | Key Selling Point |
|------|------|-----------|-------------------|
| 15m² | Compact Studio | Home office, art studio, yoga room | No planning permission. Fits most gardens. |
| 25m² | Garden Suite | Home office + meeting space, home gym, music studio, 1 bed room en suite | Largest size with no planning permission. Most popular. |
| 35m² | Garden Living | Guest suite, teen retreat, rental unit | Spacious enough for overnight stays. |
| 45m² | Grand Studio | Self-contained apartment, multi-room workspace | Ready for new legislation. Register your interest. |

### 3. Why Steel Frame? (USP Section)
4-icon feature grid (reuse FeatureSection component):

- **Precision Engineering** - CNC-cut steel, zero thermal bridging
- **Speed of Build** - 6-8 week typical timeline
- **Energy Efficient** - A-rated BER, superior insulation
- **Built to Last** - 50+ year structural lifespan, no rot/warp

### 4. Planning Permission Guide
Informational section targeting high-intent keywords:
- Current exemptions (up to 25m²) with conditions
- Upcoming legislation (35m² & 45m² threshold)
- "We handle the paperwork" messaging
- Links to official planning resources

### 5. Gallery / Portfolio
Masonry gallery of completed garden room projects.
Category filters: All | Home Office | Living Space | Gym/Studio

### 6. Testimonials
2-3 customer quotes with name, location, project type.

### 7. FAQ Section
Targeting FAQPage schema for rich snippets:
1. "Do I need planning permission for a garden room in Ireland?"
2. "How long does it take to build a garden room?"
3. "What sizes of garden rooms do you offer?"
4. "Are your garden rooms insulated and heated?"
5. "Can I use a garden room as a home office year-round?"
6. "What is included in the price?"

### 8. CTA / Contact Form
"Ready to Start Your Garden Room Project?"
- Embedded contact form or link to /contact
- Phone number prominently displayed
- "Free consultation" messaging

---

## Schema Markup Plan

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage" },
    { "@type": "BreadcrumbList" },
    {
      "@type": "Product",
      "name": "Garden Room",
      "brand": "Modular House",
      "offers": [
        { "name": "15m² Compact Studio", "priceCurrency": "EUR" },
        { "name": "25m² Garden Suite", "priceCurrency": "EUR" },
        { "name": "35m² Garden Living", "priceCurrency": "EUR" },
        { "name": "45m² Grand Studio", "priceCurrency": "EUR" }
      ]
    },
    { "@type": "FAQPage" }
  ]
}
```

---

## Internal Linking Strategy

- Hero CTA → /contact
- Each product card "Get a Quote" → /contact?product=garden-room-{size}
- Gallery → /gallery (filtered to garden rooms)
- Planning permission section → external gov.ie link
- Footer breadcrumb: Home > Garden Room
