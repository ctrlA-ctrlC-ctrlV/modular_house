# Feature Specification: Garden Room Page Redesign

**Feature Branch**: `008-garden-room-redesign`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Redesign the /garden-room page to showcase the new standardized product line (15m², 25m², 35m², 45m²) with 8 content sections, new ProductRangeGrid component, planning permission guide, FAQ with schema markup, and multiple conversion CTAs."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Product Range by Size (Priority: P1)

A prospective customer visits the `/garden-room` page to explore what garden room sizes Modular House offers. They scroll past the hero to the Product Range section, where they see four product cards (15m², 25m², 35m², 45m²). Each card displays the size, product name, typical use cases, and planning permission status. The customer identifies the 25m² Garden Suite as the best fit and clicks "Get a Quote" to navigate to the contact page with the selected product pre-filled.

**Why this priority**: The product range showcase is the core purpose of the redesign — transforming the page from a gallery into a product-led experience that directly communicates the new standardized product line.

**Independent Test**: Can be tested by loading `/garden-room`, scrolling to Section 2, verifying all four product cards render with correct content, and clicking a CTA to confirm navigation to `/contact` with the appropriate product query parameter.

**Acceptance Scenarios**:

1. **Given** a visitor is on the `/garden-room` page, **When** they scroll to the Product Range section, **Then** they see four product cards displaying: 15m² Compact Studio, 25m² Garden Suite, 35m² Garden Living, and 45m² Grand Studio.
2. **Given** a visitor views the product cards, **When** they look at the 25m² card, **Then** they see a "Most Popular" badge, use cases (home office, meeting space, home gym, music studio, 1 bed room en suite), and "No planning permission required" note.
3. **Given** a visitor views the 35m² or 45m² card, **When** they look at its status, **Then** they see a "Coming Soon" badge, "Legislation pending" note, and a "Register Interest" CTA instead of "Get a Quote".
4. **Given** a visitor clicks "Get a Quote" on the 15m² card, **When** navigation completes, **Then** they arrive at `/contact` with a query parameter identifying the 15m² garden room product.
5. **Given** a visitor clicks "Register Interest" on the 35m² or 45m² card, **When** navigation completes, **Then** they arrive at `/contact` with query parameters identifying the product and flagging it as an interest registration.

---

### User Story 2 - Learn About Planning Permission (Priority: P2)

A homeowner considering a garden room wants to understand whether they need planning permission. They visit `/garden-room` and scroll to the Planning Permission section. They read a clear summary of current Irish planning exemptions (up to 25m²), learn about the pending legislation for larger sizes, and see that Modular House handles the paperwork. They click a link to learn more about planning requirements.

**Why this priority**: Planning permission is the highest-intent search query in the Irish garden room market. This section directly addresses the primary purchase barrier and positions Modular House as a knowledgeable authority, driving both SEO and conversion.

**Independent Test**: Can be tested by loading `/garden-room`, scrolling to Section 4, verifying the planning permission content renders correctly with the three key points (25m² exempt, 35m²/45m² legislation pending, paperwork handled), and confirming the "Learn More" link navigates correctly.

**Acceptance Scenarios**:

1. **Given** a visitor is on the `/garden-room` page, **When** they scroll to the Planning Permission section, **Then** they see a two-column layout with an image/illustration on the left and informational content on the right.
2. **Given** a visitor reads the Planning Permission section, **When** they review the content, **Then** they see three key points: (1) Up to 25m² needs no planning permission, (2) 35m²/45m² legislation is pending, (3) Modular House handles all paperwork.
3. **Given** a visitor wants more detail, **When** they click the "Learn More About Planning" link, **Then** they are directed to an appropriate external planning resource.

---

### User Story 3 - Evaluate Trust and Quality (Priority: P2)

A visitor who has seen the product range wants reassurance about build quality and customer satisfaction before requesting a quote. They scroll through the Why Steel Frame section (seeing precision, speed, energy efficiency, durability), view completed project photos in the Gallery, and read customer testimonials with ratings and locations.

**Why this priority**: Trust signals (USPs, gallery, testimonials) are essential for conversion on a high-value purchase. Competitors all include these sections, and their absence on the current page is a competitive disadvantage.

**Independent Test**: Can be tested by loading `/garden-room`, scrolling through Sections 3, 5, and 6, verifying the feature icons render with correct content, gallery images load with lightbox functionality, and testimonial cards display with star ratings.

**Acceptance Scenarios**:

1. **Given** a visitor scrolls to the Why Steel Frame section, **When** it loads, **Then** they see a 4-column feature grid with icons and descriptions for: Precision Steel Frame, Rapid Build, Energy Efficient, and Built to Last.
2. **Given** a visitor scrolls to the Gallery section, **When** it loads, **Then** they see a masonry grid of 6-8 completed garden room project photos with lightbox viewing capability.
3. **Given** a visitor scrolls to the Testimonials section, **When** it loads, **Then** they see 2-3 customer testimonials with star ratings, customer names, and Dublin-area locations.

---

### User Story 4 - Find Answers to Common Questions (Priority: P2)

A visitor has specific questions about garden rooms (insulation, year-round use, what's included in the price). They scroll to the FAQ section and find expandable question-answer pairs addressing common concerns. The FAQ content also serves as structured data for search engine rich snippets.

**Why this priority**: FAQ content serves dual purpose — it handles buyer objections (conversion) and enables FAQPage schema markup (SEO). No competitor currently implements FAQPage schema, making this a competitive advantage.

**Independent Test**: Can be tested by loading `/garden-room`, scrolling to Section 7, verifying all 6 FAQ items render, clicking to expand/collapse answers, and inspecting the page source for FAQPage structured data.

**Acceptance Scenarios**:

1. **Given** a visitor scrolls to the FAQ section, **When** it loads, **Then** they see 6 expandable question items covering: planning permission, build timeline, sizes offered, insulation/heating, year-round use, and price inclusions.
2. **Given** a visitor clicks on an FAQ question, **When** it expands, **Then** the answer content is revealed with a smooth transition.
3. **Given** a search engine crawls the `/garden-room` page, **When** it parses the structured data, **Then** it finds valid FAQPage schema markup with all 6 question-answer pairs.

---

### User Story 5 - Complete the Page Journey with CTA (Priority: P3)

A visitor has scrolled through the entire page, reviewed products, read about planning permission, browsed the gallery, and checked testimonials. They reach the bottom CTA section and are presented with a clear call to action to get a free quote or call directly. The full page maintains visual consistency with the rest of the site.

**Why this priority**: The bottom CTA captures visitors who have consumed the full page content and are ready to convert. While important, the page still has multiple CTAs throughout (hero, product cards) so this is supplementary.

**Independent Test**: Can be tested by scrolling to the bottom of `/garden-room`, verifying the CTA section renders with contact form or prominent call-to-action buttons, and confirming navigation to `/contact`.

**Acceptance Scenarios**:

1. **Given** a visitor reaches the bottom of the page, **When** the CTA section loads, **Then** they see a prominent section with a "Get a Free Quote" button and a phone number.
2. **Given** a visitor clicks "Get a Free Quote" in the CTA section, **When** navigation completes, **Then** they arrive at the `/contact` page.

---

### User Story 6 - SEO and Structured Data Coverage (Priority: P1)

A search engine crawls the `/garden-room` page and finds comprehensive structured data, keyword-optimized content, and proper meta tags. The page targets primary keywords ("garden room Ireland", "garden room Dublin"), includes FAQPage and Product schema markup, and has proper Open Graph and Twitter card meta tags for social sharing.

**Why this priority**: Ranking on Google for "garden room" in Dublin is a primary business objective. The current page has minimal text content and no schema markup, putting it at a severe disadvantage against competitors with 6-8+ content sections.

**Independent Test**: Can be tested by inspecting the page source for structured data (FAQPage, Product, BreadcrumbList, WebPage), verifying meta tags (title, description, OG, Twitter), and running a structured data testing tool against the rendered page.

**Acceptance Scenarios**:

1. **Given** the `/garden-room` page is loaded, **When** the page source is inspected, **Then** it contains valid JSON-LD structured data with FAQPage, Product (with 4 offers for each size), BreadcrumbList, and WebPage schemas.
2. **Given** the `/garden-room` page is loaded, **When** the meta tags are inspected, **Then** the page has an SEO-optimized title (under 70 characters), meta description (under 160 characters), canonical URL, Open Graph tags, and Twitter card tags.
3. **Given** a search engine indexes the page, **When** it evaluates content depth, **Then** it finds 8 distinct content sections with relevant H1/H2 heading hierarchy targeting primary and secondary keywords.

---

### Edge Cases

- What happens when a visitor views the page on a very narrow screen (under 320px)? All product cards stack to single column; no content is hidden or cut off.
- What happens when images fail to load? Alt text is displayed; the page remains functional and readable without images.
- What happens when a visitor clicks "Register Interest" for 35m²/45m² — does the contact form clearly indicate this is an interest registration, not a purchase order? The contact page should reflect the pre-selected product and interest context via query parameters.
- What happens if the 35m²/45m² legislation passes and these sizes become available? The product cards can be updated by changing the `available` flag, badge text, and CTA text without structural changes.
- What happens when the page is shared on social media? Open Graph and Twitter card meta tags ensure a proper preview image, title, and description appear.
- What happens when a visitor navigates directly to an anchor link (e.g., from an internal link to the FAQ section)? The page scrolls smoothly to the target section.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Page MUST display a full-viewport hero section with background image, headline, descriptive text, a primary CTA button ("Get a Free Quote" linking to `/contact`), and an anchor link ("Explore Our Ranges") that scrolls to the product range section.
- **FR-002**: Page MUST display a Product Range section with four product cards in a responsive grid (4 columns on desktop 1280px+, 2 columns on tablet 768-1279px, 1 column on mobile below 768px).
- **FR-003**: Each product card MUST display: size label (m²), product name, hero image (with WebP/AVIF optimized variants), list of typical use cases, planning permission status note, and a CTA button.
- **FR-004**: The 25m² card MUST display a "Most Popular" badge.
- **FR-005**: The 35m² and 45m² cards MUST display a "Coming Soon" badge, a "Legislation pending" note, and a "Register Interest" CTA (instead of "Get a Quote"), with a visually distinct treatment (dashed border, subtle opacity reduction on image).
- **FR-006**: Product card CTA buttons MUST navigate to `/contact` with query parameters identifying the selected product size (e.g., `?product=garden-room-15`). "Register Interest" CTAs MUST include an additional interest flag parameter.
- **FR-007**: Page MUST display a "Why Steel Frame" section using a 4-column feature grid with icons and descriptions for: Precision Steel Frame, Rapid Build, Energy Efficient, and Built to Last.
- **FR-008**: Page MUST display a Planning Permission section in a two-column layout with an image/illustration on one side and informational content on the other, covering: current 25m² exemption, pending 35m²/45m² legislation, and "we handle paperwork" messaging.
- **FR-009**: Page MUST display a Gallery section with a masonry grid of 6-8 completed garden room project photos, with lightbox viewing capability.
- **FR-010**: Page MUST display a Testimonials section with 2-3 customer testimonials including star ratings, customer first name and last initial, and Dublin-area locations.
- **FR-011**: Page MUST display an FAQ section with 6 expandable question-answer items covering: planning permission, build timeline, sizes offered, insulation/heating, year-round use, and price inclusions.
- **FR-012**: Page MUST display a bottom CTA section with a "Get a Free Quote" button linking to `/contact` and a phone number.
- **FR-013**: Sections MUST alternate between white and beige (#F6F5F0) backgrounds, with dark overlay bookends on hero and CTA sections.
- **FR-014**: Page MUST include JSON-LD structured data for: FAQPage (with all 6 Q&A pairs), Product (with 4 size-based offers), BreadcrumbList (Home > Garden Room), and WebPage.
- **FR-015**: Page MUST include SEO meta tags: optimized title, meta description, canonical URL, Open Graph tags (title, description, image, URL, type), and Twitter card tags.
- **FR-016**: All images MUST use optimized formats with AVIF/WebP/PNG fallback chain. Hero image MUST use priority loading (eager + high fetchpriority).
- **FR-017**: Page MUST maintain visual consistency with the existing site design language (serif headings, sans-serif body text, rust-orange CTA colour, existing component library styling).
- **FR-018**: Page MUST be fully responsive across mobile (below 768px), tablet (768-1279px), and desktop (1280px+) breakpoints.

### Key Entities

- **Product Card**: Represents a garden room size option. Attributes: size (m²), name, hero image (with optimized variants), use cases list, planning permission note, badge (optional: "Most Popular" or "Coming Soon"), CTA text, CTA link, availability status.
- **FAQ Item**: Represents a question-answer pair. Attributes: question text, answer text, display order.
- **Testimonial**: Represents a customer review. Attributes: quote text, customer name, location, star rating.
- **Section**: Represents a page content block. Attributes: background colour variant (white, beige, dark overlay), vertical padding, content type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Page displays all 8 content sections (hero, product range, why steel, planning permission, gallery, testimonials, FAQ, CTA) in the correct order with correct alternating background colours.
- **SC-002**: All 4 product cards render with correct size, name, use cases, planning status, badge, and CTA — and clicking each CTA navigates to `/contact` with the correct query parameters.
- **SC-003**: Page content is fully readable and navigable on screens from 320px to 2560px wide without horizontal scrolling or content overflow.
- **SC-004**: Structured data validation passes for all 4 schema types (FAQPage, Product, BreadcrumbList, WebPage) when tested with a structured data validator.
- **SC-005**: Page loads with all images optimized (AVIF/WebP fallback chain), hero image uses priority loading, and below-fold images use lazy loading.
- **SC-006**: All 6 FAQ items expand and collapse correctly when clicked, revealing answer content.
- **SC-007**: Gallery lightbox opens on image click, supports keyboard navigation (arrow keys, Escape to close), and displays full-size images.
- **SC-008**: Page maintains visual consistency with the Landing page — uses the same typography, colour tokens, and component styling.
- **SC-009**: The 35m² and 45m² product cards are visually distinct from available products (dashed border, reduced opacity, "Coming Soon" badge) so visitors clearly understand these are not yet orderable.
- **SC-010**: SEO meta tags (title under 70 chars, description under 160 chars, OG tags, Twitter cards, canonical URL) are present and correctly populated in the page source.

## Assumptions

- Testimonial content (customer names, quotes, locations, ratings) will use placeholder data that the client can replace with real testimonials. The component structure supports this swap without code changes.
- Product images for each size category (15m², 25m², 35m², 45m²) will use existing garden room photography from the project's image assets. New photography for specific sizes is not required for launch.
- The planning permission "Learn More" link will point to an appropriate external government resource (e.g., gov.ie planning guidance). The exact URL will be confirmed by the client.
- FAQ answer content will be drafted based on the company's existing marketing materials and common industry answers. Final copy may be refined by the client.
- The contact page (`/contact`) already supports query parameters for pre-selecting a product type. If it does not, this feature will need to handle that gracefully (navigating to `/contact` without query params as a fallback).
- No new photography or illustration assets are required. The planning permission section will use an existing garden room photo in the image column.
- The "Register Interest" flow for 35m²/45m² uses the same contact form as "Get a Quote" — differentiated only by query parameters and any pre-fill behaviour on the contact page.

## Design References

All design artifacts are located in `.docs/garden-room/`:

- **wireframe.md** — Desktop (1440px) and mobile (375px) ASCII wireframes with section-to-component mapping
- **content-strategy.md** — Target keywords, copy direction, meta tag content, schema markup plan, internal linking strategy
- **competitor-analysis.md** — Analysis of 4 top-ranked Irish garden room websites with SEO and content patterns
- **design-rationale.md** — Design decisions, consistency matrix, SEO advantages, and conversion flow diagram
