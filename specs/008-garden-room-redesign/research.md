# Research: Garden Room Page Redesign

**Feature**: 008-garden-room-redesign
**Date**: 2026-03-03

## Research Tasks & Findings

### R-001: Contact Page Query Parameter Support

**Context**: Spec FR-006 requires product card CTAs to navigate to `/contact?product=garden-room-15`. The contact page currently does NOT read query parameters.

**Finding**: `apps/web/src/routes/Contact.tsx` uses the `TextWithContactForm` component which accepts an `onSubmit` callback. The form has a `preferredProduct` field but it is not pre-populated from URL query params.

**Decision**: Extend the Contact page to read `?product=` and `?interest=` query parameters from the URL using `useSearchParams()` from react-router-dom. Map the product param to pre-select the `preferredProduct` field. The interest flag can prepend "[Interest Registration]" to the message or set a hidden field.

**Rationale**: Minimal change to Contact.tsx. `useSearchParams` is already available via react-router-dom 6.28. No backend changes needed — the parameter mapping happens in the React component.

**Alternatives considered**:
- Separate "Register Interest" form page → rejected (over-engineering for 2 product sizes; same form fields apply)
- Pass state via React Router `state` prop → rejected (doesn't work for direct links or bookmarks)

---

### R-002: FAQ Section — New AccordionFAQ Component

**Context**: Spec FR-011 requires "6 expandable question-answer items" with FAQPage schema. SC-006 requires "FAQ items expand and collapse correctly when clicked". Edge cases reference `aria-expanded` and `aria-controls` attributes.

**Finding**: `MiniFAQs` renders a styled numbered list (01, 02, 03...) with title and description always visible. It does NOT have expand/collapse behaviour — all content is visible at once. It has an `onFAQClick` callback but no toggle state. It lacks `aria-expanded` and `aria-controls` attributes.

**Decision**: Create a new `AccordionFAQ` component in `packages/ui/src/components/AccordionFAQ/` that satisfies the spec's expandable requirement. The component will:
- Use `useState<Set<string>>` for independent toggle state (multiple items can be open)
- Render `<button>` triggers with `aria-expanded` and `aria-controls` attributes
- Render collapsible `<div role="region">` content panels
- Animate open/close with CSS `max-height` transition (300ms ease)
- Support keyboard interaction (Enter/Space to toggle)
- Follow BEM CSS convention consistent with existing components
- Reuse the same `FAQItem` data shape (extended with `id` field for ARIA)

MiniFAQs remains unchanged and available for other use cases where all-visible display is preferred.

**Rationale**: The spec explicitly requires expandable/collapsible FAQ items (FR-011, SC-006, edge cases). Creating a dedicated component keeps MiniFAQs untouched (open-closed principle), satisfies accessibility requirements (WCAG 2.1 AA), and provides proper `aria-expanded`/`aria-controls` semantics. Google still indexes FAQ content in accordion format when using proper schema markup — the FAQPage JSON-LD schema is independent of the visual presentation.

**Alternatives considered**:
- Extend MiniFAQs with `collapsible` prop → rejected (violates single-responsibility; MiniFAQs is a display component, not an interactive one)
- Use MiniFAQs as-is (all visible) → rejected (contradicts spec FR-011 "expandable" and SC-006 "expand and collapse")
- Use a third-party accordion library → rejected (adds dependency for simple feature)

---

### R-003: Product Card Image Strategy

**Context**: Spec assumes product images per size (15m², 25m², 35m², 45m²). Need to confirm available images.

**Finding**: Available garden room images in `/public/resource/garden-room/`:
- `garden-room1.{png,webp,avif}` through `garden-room5.{png,webp,avif}` — completed project photos
- `garden-room-sauna1-3.{webp,avif}` — sauna-specific photos
- `garden_room_hero.{png,webp,avif}` — hero banner

No images are tagged by size (15m², 25m², etc.). All are general garden room photographs.

**Decision**: Assign existing images to product cards based on visual appropriateness:
- 15m² Compact Studio → `garden-room4` (smaller-looking room)
- 25m² Garden Suite → `garden-room1` (mid-size, popular look)
- 35m² Garden Living → `garden-room2` (spacious interior)
- 45m² Grand Studio → `garden-room3` (largest-looking)

These assignments are data-driven (passed as props) and trivially swappable when dedicated photography becomes available.

**Rationale**: Ship with best available images now; no photography dependency blocks launch.

---

### R-004: Structured Data Implementation Pattern

**Context**: Spec FR-014 requires FAQPage, Product, BreadcrumbList, and WebPage schemas.

**Finding**: The project already uses JSON-LD `@graph` pattern in `routes-metadata.ts`. The garden-room route already has Product schema and `generatePageSchema()` (which produces WebPage + BreadcrumbList). FAQPage schema needs to be added.

**Decision**: Extend the existing schema array in the garden-room route metadata:
1. Update the existing Product schema to include 4 size-based offers
2. FAQPage schema added as a new entry in the `schema` array
3. BreadcrumbList and WebPage already generated via `generatePageSchema()`

The FAQ Q&A data will be defined once (as a constant array) and referenced both by the AccordionFAQ component props AND the FAQPage schema generation — single source of truth.

**Rationale**: Follows established patterns. No architectural changes needed.

---

### R-005: "Coming Soon" Card Visual Treatment

**Context**: Spec FR-005 requires visually distinct treatment for 35m²/45m² cards (dashed border, opacity reduction, "Coming Soon" badge).

**Finding**: No existing component has a "coming soon" or "unavailable" variant. The ProductRangeGrid is a new component, so this can be built in from the start.

**Decision**: The `ProductCard` interface includes an `available: boolean` flag. When `available === false`:
- Card border changes to dashed (CSS: `border-style: dashed`)
- Image opacity reduces to 0.7 (CSS: `opacity: 0.7`)
- Badge renders "Coming Soon" with a distinct background colour (muted grey vs brand rust)
- CTA renders as outline button ("Register Interest") vs filled button ("Get a Quote")

All controlled via a single CSS modifier class: `.product-range-card--coming-soon`.

**Rationale**: Single flag controls all visual differences. Easy to flip when legislation passes.

---

### R-006: Hero Section "Explore Our Ranges" Anchor Link

**Context**: Spec FR-001 requires an anchor link that smooth-scrolls to the product range section.

**Finding**: `HeroBoldBottomText` does not currently have a secondary link/anchor prop. It only has `ctaText`/`ctaLink` for the primary button.

**Decision**: Two options:
1. Add the "Explore Our Ranges" link directly in GardenRoom.tsx, positioned below the HeroBoldBottomText component but visually inside the hero section (absolute positioning)
2. Extend HeroBoldBottomText with optional `secondaryLinkText`/`secondaryLinkHref` props

We'll go with option 1 (page-level positioning) to avoid modifying a shared component for a page-specific need. The anchor link will use `scrollIntoView({ behavior: 'smooth' })` to scroll to the product range section's `id`.

**Rationale**: Avoids modifying shared component API. Keeps the change scoped to the garden-room page.

**Alternatives considered**:
- Extend HeroBoldBottomText props → rejected (adds page-specific feature to shared component)
