# Garden Room Page - Design Rationale

## Why This Structure?

### Problem with the Current Page
The current `/garden-room` page has only 2 sections: a hero and a gallery. This is:
- **Weak for SEO**: Minimal text content, no keyword-rich sections, no FAQ schema opportunity
- **Poor for conversion**: Single CTA in hero, no product details, no trust signals
- **Missing product showcase**: No way to communicate the new size-based product line
- **Below competitor standard**: All top-ranking competitors have 6-8+ content sections

### The Redesign Strategy

**8 sections, each with a job:**

| Section | SEO Job | Conversion Job |
|---------|---------|----------------|
| Hero | H1 keyword targeting | Primary CTA + brand impression |
| Product Range | Size-specific keyword clusters | Product comparison + per-size CTAs |
| Why Steel Frame | USP keywords (steel frame, energy efficient) | Differentiation from timber competitors |
| Planning Guide | Planning permission keywords (highest search volume) | Removes purchase barrier + positions as expert |
| Gallery | Image alt text optimization | Visual proof of quality |
| Testimonials | Review signals | Social proof + trust |
| FAQ | FAQPage schema → rich snippets | Objection handling |
| CTA | — | Final conversion push |

---

## Key Design Decisions

### 1. Size-Based Product Cards (not branded names)

**Decision**: Use "15m² / 25m² / 35m² / 45m²" instead of aspirational names like "Cube" or "Classic".

**Rationale**:
- Irish planning permission law is defined by m² thresholds — buyers search by size
- Competitors use branded names (Cube, Ultimate) which are not searchable
- Size-first naming makes the planning permission benefit instantly clear
- Reduces cognitive load: buyers know their garden size, not industry jargon

### 2. 35m² & 45m² "Coming Soon" Card

**Decision**: Include the 35m² and 45m² product as a visible but distinct card with "Register Interest" CTA.

**Rationale**:
- Signals forward-thinking and market readiness
- Captures leads from early-interest buyers
- Creates a content hook for the legislation discussion
- Differentiates from competitors who don't address the upcoming change
- Card uses dashed border + "Coming Soon" badge to set correct expectations

### 3. Planning Permission Section

**Decision**: Dedicate an entire section to planning permission guidance.

**Rationale**:
- "garden room planning permission Ireland" is a top search query
- Competitors mention it briefly but none have a dedicated, informative section
- Positions Modular House as the knowledgeable, trustworthy option
- Directly supports the size-based product positioning (25m² = no permission)
- Opportunity to discuss the 45m² legislation change

### 4. Reuse Existing Components

**Decision**: Only 1 new component (`ProductRangeGrid`). All other sections use existing UI library components.

**Rationale**:
- Maintains visual consistency with Landing and other pages
- Reduces development time and testing surface
- Leverages proven, accessible, responsive components
- The product card grid is the only truly new pattern needed

### 5. Alternating Background Colours

**Decision**: White → Beige → White → Beige pattern with dark bookends.

**Rationale**:
- Matches the Landing page's visual rhythm
- Creates clear section boundaries without heavy borders
- Beige (#F6F5F0) is already established as the secondary background
- Dark hero + dark CTA "frame" the page and create visual bookends

### 6. FAQ with Schema Markup

**Decision**: Full FAQ section with FAQPage structured data.

**Rationale**:
- No competitor currently implements FAQPage schema (competitive gap)
- FAQPage schema can generate rich snippets in Google search results
- Directly addresses common buyer objections
- Reuses the existing `MiniFAQs` component
- Questions are crafted around high-search-volume queries

---

## Consistency with Existing Site

| Element | Landing Page | Garden Room (Redesign) | Consistent? |
|---------|-------------|----------------------|-------------|
| Hero style | HeroWithSideText | HeroBoldBottomText | Same family |
| Feature grid | FeatureSection (4 cols) | FeatureSection (4 cols) | Identical |
| Split layout | TwoColumnSplitLayout | TwoColumnSplitLayout | Identical |
| Gallery | MasonryGallery | FullMasonryGallery | Same family |
| Testimonials | TestimonialGrid | TestimonialGrid | Identical |
| FAQ | MiniFAQs (3 items) | MiniFAQs (6 items) | Same component |
| CTA | ContactFormWithImageBg | ContactFormWithImageBg | Identical |
| New element | — | ProductRangeGrid | New (follows card pattern) |

The redesign feels like a natural extension of the Landing page, not a different site.

---

## SEO Advantages Over Competitors

1. **FAQPage schema** — None of the 4 analyzed competitors use this
2. **Product schema** — Size-based offerings with structured data
3. **BreadcrumbList** — Clear navigation hierarchy for Google
4. **Content depth** — 8 sections vs competitor average of 5-6
5. **Planning permission content** — Targeting highest-intent search queries
6. **Size-based keywords** — "25m2 garden room" has no competition
7. **Internal linking** — Per-product CTAs to /contact with query params

---

## Conversion Flow

```
Hero CTA ──────────────────────────────────→ /contact
    │
    ▼ (scroll)
Product Card "Get Quote" ──────────────────→ /contact?product=garden-room-{size}
Product Card "Register Interest" (45m²) ───→ /contact?product=garden-room-45&interest=true
    │
    ▼ (scroll)
Planning section "Learn More" ─────────────→ external planning resource
    │
    ▼ (scroll)
Gallery "View Full Gallery" ───────────────→ /gallery
    │
    ▼ (scroll)
Bottom CTA "Get a Free Quote" ─────────────→ /contact
Bottom CTA "Call Us" ──────────────────────→ tel:+353XXXXXXX
```

Multiple conversion opportunities throughout the page, not just at the top.
