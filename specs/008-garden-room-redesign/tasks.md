# Tasks: Garden Room Page Redesign

**Input**: Design documents from `/specs/008-garden-room-redesign/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/product-range-grid.md, contracts/accordion-faq.md

**Tests**: Unit tests included for the new ProductRangeGrid and AccordionFAQ components per constitution Test Discipline principle.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Ensure the development environment is ready and dependencies are installed.

- [x] T001 Checkout the `008-garden-room-redesign` branch and run `pnpm install` to ensure all dependencies are up to date. Verify the dev server starts with `pnpm --filter @modular-house/web dev` and confirm the current `/garden-room` page loads at `http://localhost:5173/garden-room`.

---

## Phase 2: Foundational (New Component + Shared Data)

**Purpose**: Create the two new components (`ProductRangeGrid` and `AccordionFAQ`) and define the shared data constants (FAQ items, product cards, feature items, testimonials) that multiple user stories depend on. This phase MUST complete before any user story phase begins.

- [x] T002 Create the `ProductRangeGrid` component directory at `packages/ui/src/components/ProductRangeGrid/`. Create `ProductRangeGrid.tsx` implementing the `ProductRangeGridProps` and `ProductCard` interfaces exactly as defined in `specs/008-garden-room-redesign/contracts/product-range-grid.md`. The component must: (1) Render a `<section>` with `aria-labelledby` pointing to the title `id`. (2) Display an eyebrow `<p>`, `<h2>` title, and description `<p>` inside a header div. (3) Render a CSS Grid container (`product-range-grid__grid`) that maps over the `products` array. (4) Each product renders as an `<article>` with class `product-range-card` (add modifier `product-range-card--coming-soon` when `available === false`). (5) Inside each card: an image wrapper containing an `OptimizedImage` (using `image`/`imageWebP`/`imageAvif` props, with `alt` text like "15m² Compact Studio garden room") and an optional badge `<span>` (absolute-positioned top-right, with modifier `--popular` or `--coming-soon`). (6) Below the image: size `<p>`, name `<h3>`, use-cases `<ul>`, planning note `<p>`, and a CTA link rendered via `renderLink` (falling back to `<a>`) with class `product-range-card__cta` (add modifier `--outline` when `available === false`). (7) Export both `ProductRangeGrid` component and `ProductCard`/`ProductRangeGridProps` types.

- [x] T003 Create `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.css` with BEM-styled CSS. Include: (1) `.product-range-grid` section wrapper with 80px vertical padding. (2) `.product-range-grid__header` with centered text and bottom margin. (3) `.product-range-grid__eyebrow` styled uppercase, letter-spacing 0.12em, font-size `var(--text-caption)`, colour `var(--theme-color-meta)`. (4) `.product-range-grid__title` using `var(--font-serif)` and `var(--text-heading-l)`. (5) `.product-range-grid__grid` as CSS Grid: `grid-template-columns: repeat(4, 1fr)` with gap 24px. (6) `.product-range-card` with solid 1px border `var(--theme-color-border, #E5E7DE)`, border-radius 0.5rem, overflow hidden, display flex flex-column. (7) `.product-range-card--coming-soon` with `border-style: dashed; border-width: 2px`. (8) `.product-range-card__image-wrapper` with position relative, aspect-ratio 3/2, overflow hidden. (9) `.product-range-card--coming-soon .product-range-card__image-wrapper img` with `opacity: 0.7`. (10) `.product-range-card__badge` absolute positioned top 12px right 12px, padding 4px 12px, border-radius 4px, font-size `var(--text-tiny)`, font-weight 600, colour white. (11) `.product-range-card__badge--popular` with background `var(--brand-link, #B55329)`. (12) `.product-range-card__badge--coming-soon` with background `#888`. (13) `.product-range-card__size` using `var(--text-heading-m)`, font-weight 600. (14) `.product-range-card__name` using `var(--font-serif)`, `var(--text-heading-s)`. (15) `.product-range-card__use-cases` as a list with padding-left 1.2em, font-size `var(--text-body)`. (16) `.product-range-card__planning-note` font-size `var(--text-caption)`, colour green for available or amber for coming-soon. (17) `.product-range-card__cta` as full-width button: background `var(--brand-link, #B55329)`, colour white, text-align center, padding 12px, border-radius 0.5rem, font-weight 500, text-decoration none, display block, margin-top auto. (18) `.product-range-card__cta--outline` with background transparent, border 2px solid `var(--brand-link)`, colour `var(--brand-link)`. (19) Hover states: filled button darkens to `var(--brand-link-hover, #9F4017)`, outline button gets light background. (20) Focus-visible outlines on CTA. (21) Responsive: at max-width 1279px grid becomes `repeat(2, 1fr)` gap 20px; at max-width 767px grid becomes `1fr` gap 16px. (22) Card content padding: 20px on all sides below the image.

- [x] T004 Add exports for `ProductRangeGrid` and `AccordionFAQ` to `packages/ui/src/index.ts`. Add lines exporting `ProductRangeGrid` and its types (`ProductCard`, `ProductRangeGridProps`) from `'./components/ProductRangeGrid/ProductRangeGrid'`, and `AccordionFAQ` and its types (`AccordionFAQItem`, `AccordionFAQProps`) from `'./components/AccordionFAQ/AccordionFAQ'`, following the same pattern used by existing component exports in the file.

- [x] T005 Create `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.test.tsx` with unit tests using Vitest + React Testing Library. Test cases: (1) Renders all 4 product cards when given 4 products. (2) Displays the eyebrow, title, and description text. (3) Shows "Most Popular" badge on the 25m² card (the card with `badge: "Most Popular"`). (4) Shows "Coming Soon" badge on 35m² and 45m² cards. (5) Applies `product-range-card--coming-soon` CSS class when `available` is false. (6) Renders "Get a Quote" CTA for available products and "Register Interest" for unavailable products. (7) CTA links contain correct `href` values (e.g., `/contact?product=garden-room-25`). (8) Each card renders the use-cases list with the correct number of `<li>` items. (9) Renders correctly with 3, 4, or 5 products (edge case for future 5th size). (10) Each card `<article>` contains an `<h3>` with the product name. Use mock data matching the 4 products from `data-model.md`.

- [x] T005a Create the `AccordionFAQ` component at `packages/ui/src/components/AccordionFAQ/AccordionFAQ.tsx` implementing the `AccordionFAQProps` and `AccordionFAQItem` interfaces exactly as defined in `specs/008-garden-room-redesign/contracts/accordion-faq.md`. The component must: (1) Render a `<section>` with `aria-labelledby` pointing to the title `id`. (2) Display a `<h2>` title inside a header div. (3) Render a list container div that maps over the `faqs` array. (4) Each FAQ item renders as a `<div>` with class `accordion-faq-item` (add modifier `accordion-faq-item--open` when expanded). (5) Each item has a `<button>` trigger with `id="trigger-{id}"`, `aria-expanded` (true/false), and `aria-controls="panel-{id}"`, containing the number `<span>`, question title `<span>`, and chevron `<span aria-hidden="true">`. (6) Each item has a content panel `<div>` with `id="panel-{id}"`, `role="region"`, `aria-labelledby="trigger-{id}"`, and `hidden` attribute when collapsed, containing the answer `<p>`. (7) Use `React.useState<Set<string>>` to track open item IDs — multiple items can be open simultaneously. (8) Handle keyboard: Enter and Space on trigger toggles the item. (9) Call optional `onToggle` callback with item, index, and new open state. (10) Export both `AccordionFAQ` component and `AccordionFAQItem`/`AccordionFAQProps` types.

- [x] T005b Create `packages/ui/src/components/AccordionFAQ/AccordionFAQ.css` with BEM-styled CSS. Include: (1) `.accordion-faq` section wrapper with 80px vertical padding. (2) `.accordion-faq__header` with centered text and bottom margin. (3) `.accordion-faq__title` using `var(--font-serif)` and `var(--text-heading-l)`. (4) `.accordion-faq__list` max-width 900px centered. (5) `.accordion-faq-item` with bottom border 1px solid `var(--theme-color-border, #E5E7DE)`. (6) `.accordion-faq-item__trigger` as a full-width `button` with: `display: flex`, `align-items: center`, `gap: 16px`, `width: 100%`, `background: transparent`, `border: none`, `padding: 20px 0`, `cursor: pointer`, `text-align: left`. (7) `.accordion-faq-item__trigger:hover` with subtle background `rgba(0,0,0,0.02)`. (8) `.accordion-faq-item__number` using `var(--text-heading-m)`, colour `var(--brand-link, #B55329)`, min-width 48px. (9) `.accordion-faq-item__question` using `var(--font-serif)`, `var(--text-heading-s)`, `flex: 1`. (10) `.accordion-faq-item__chevron` 16px, colour `var(--theme-color-meta)`, transition `transform 300ms ease`. (11) `.accordion-faq-item--open .accordion-faq-item__chevron` with `transform: rotate(180deg)`. (12) `.accordion-faq-item__panel` with `max-height: 0`, `overflow: hidden`, `transition: max-height 300ms ease`. (13) `.accordion-faq-item--open .accordion-faq-item__panel` with `max-height: 500px` (large enough for content). (14) `.accordion-faq-item__answer` with `padding: 0 0 20px 64px` (indented past the number column), font-size `var(--text-body)`, colour `var(--theme-color-body)`. (15) Focus-visible outline on trigger. (16) Responsive: at max-width 767px, reduce padding and number min-width.

- [x] T005c Create `packages/ui/src/components/AccordionFAQ/AccordionFAQ.test.tsx` with unit tests using Vitest + React Testing Library. Test cases: (1) Renders all 6 FAQ items when given 6 items. (2) All items start collapsed (aria-expanded="false"). (3) Clicking a trigger expands the corresponding panel (aria-expanded="true", panel visible). (4) Clicking an expanded trigger collapses it. (5) Multiple items can be open simultaneously. (6) Each trigger has correct `aria-controls` matching panel `id`. (7) Each panel has `role="region"` and correct `aria-labelledby`. (8) Keyboard: pressing Enter on a trigger toggles the item. (9) Keyboard: pressing Space on a trigger toggles the item. (10) Calls `onToggle` callback with correct item, index, and isOpen state. (11) Renders title heading when provided. (12) Collapsed panels have `hidden` attribute. Use mock FAQ data with `id`, `number`, `title`, and `description` fields.

- [x] T006 [P] Create a shared data constants file at `apps/web/src/data/garden-room-data.ts`. Define and export: (1) `GARDEN_ROOM_PRODUCTS`: array of 4 `ProductCard` objects matching the instances in `data-model.md` — 15m² Compact Studio (image: `/resource/garden-room/garden-room4.{png,webp,avif}`, useCases: ["Home office", "Art studio", "Yoga room"], planningNote: "No planning permission required", ctaText: "Get a Quote", ctaLink: "/contact?product=garden-room-15", available: true), 25m² Garden Suite (image: garden-room1, badge: "Most Popular", useCases: ["Home office + meeting space", "Home gym", "Music studio", "1 bed room en suite"], planningNote: "No planning permission required", ctaText: "Get a Quote", ctaLink: "/contact?product=garden-room-25", available: true), 35m² Garden Living (image: garden-room2, badge: "Coming Soon", useCases: ["Guest suite", "Teen retreat", "Rental unit"], planningNote: "Legislation pending", ctaText: "Register Interest", ctaLink: "/contact?product=garden-room-35&interest=true", available: false), 45m² Grand Studio (image: garden-room3, badge: "Coming Soon", useCases: ["Self-contained apartment", "Multi-room workspace"], planningNote: "Legislation pending", ctaText: "Register Interest", ctaLink: "/contact?product=garden-room-45&interest=true", available: false). (2) `GARDEN_ROOM_FAQS`: array of 6 `AccordionFAQItem` objects with id ("faq-1" through "faq-6"), number ("01"-"06"), title (the question text), and description (the answer text) for: planning permission, build timeline, sizes offered, insulation/heating, year-round use, price inclusions. Draft answers based on common Irish garden room industry information. (3) `GARDEN_ROOM_FEATURES`: array of 4 `FeatureItem` objects (icon will be JSX from CustomIcons, title, description) for: Precision Steel Frame, Rapid Build, Energy Efficient, Built to Last — using descriptions from the wireframe. (4) `GARDEN_ROOM_TESTIMONIALS`: array of 3 placeholder `TestimonialItem` objects with text (realistic quotes about garden rooms), authorName (Irish names, first + last initial), authorLocation (Dublin suburbs: e.g., Dalkey, Blackrock, Malahide), authorImageSrc (use a placeholder path like `/resource/avatar-placeholder.png`), rating: 5. (5) `GARDEN_ROOM_GALLERY`: array of 6-8 `GalleryItem` objects using existing images from `/resource/garden-room/` (garden-room1 through garden-room5, plus sauna images), with descriptive titles and category "Garden Room".

**Checkpoint**: ProductRangeGrid and AccordionFAQ components are built, tested, and exported. All shared data constants are defined. User story implementation can begin.

---

## Phase 3: User Story 1 — Browse Product Range by Size (Priority: P1) 🎯 MVP

**Goal**: Visitors see 4 product cards (15m², 25m², 35m², 45m²) with correct content, badges, and CTAs that navigate to `/contact` with product query parameters.

**Independent Test**: Load `/garden-room`, scroll to Section 2, verify 4 product cards render with correct sizes/names/badges/CTAs. Click "Get a Quote" on 25m² card → verify navigation to `/contact?product=garden-room-25`.

### Implementation for User Story 1

- [X] T007 [US1] Rewrite `apps/web/src/routes/GardenRoom.tsx` — **Hero + Product Range sections only** (sections 1 and 2 of the 8-section design). Keep the existing header config setup (`useHeaderConfig` with dark variant, `positionOver: true`) and `renderLink` helper. Replace the current content with: (1) **Section 1 — Hero**: Wrap in a `<div id="garden_room_hero">`. Render `HeroBoldBottomText` with updated props: `titleLine1="Steel Frame Garden Rooms"`, `titleLine2="Built to Last. Designed for Living."`, `ctaText="Get a Free Quote"`, `ctaLink="/contact"`, `backgroundImage="/resource/garden_room_hero.png"` (plus WebP/AVIF variants), `bigText="Garden Room"`, `renderLink={renderLink}`. Immediately after the `HeroBoldBottomText` closing tag (but visually overlapping the hero via absolute positioning), add an "Explore Our Ranges" anchor link — a `<button>` or `<a>` styled with class `garden-room__explore-link` that calls `document.getElementById('product-range')?.scrollIntoView({ behavior: 'smooth' })` on click. (2) **Section 2 — Product Range**: Wrap in a `<div id="product-range">`. Import `ProductRangeGrid` from `@modular-house/ui` and `GARDEN_ROOM_PRODUCTS` from `../data/garden-room-data`. Render `<ProductRangeGrid eyebrow="OUR RANGE" title="Choose Your Perfect Size" description="Every garden room is precision-built with CNC-cut steel framing, superior insulation, and architectural-grade finishes." products={GARDEN_ROOM_PRODUCTS} renderLink={renderLink} />`. (3) Leave the remaining 6 sections as TODO comments (they will be added in later user stories). (4) Add minimal CSS for `.garden-room__explore-link` — position it at the bottom of the hero area, styled as a text link with a down arrow, colour white, cursor pointer.

- [X] T008 [US1] Update `apps/web/src/routes/Contact.tsx` to read URL query parameters. Import `useSearchParams` from `react-router-dom`. At the top of the Contact component, call `const [searchParams] = useSearchParams()` and extract `const product = searchParams.get('product')` and `const interest = searchParams.get('interest')`. Pass the `product` value to the `TextWithContactForm` component to pre-select the `preferredProduct` field (check how the component accepts initial values — likely as a prop or via a default value). If the `interest` parameter equals `"true"`, prepend the message field with `"[Interest Registration] "` or set a visual indicator. Handle malformed/missing params gracefully: if `product` is null or doesn't match a known product slug, default to no pre-selection (general enquiry).

**Checkpoint**: Hero + Product Range render. CTA links navigate to `/contact` with correct query params. Contact page pre-selects product.

---

## Phase 4: User Story 6 — SEO and Structured Data Coverage (Priority: P1)

**Goal**: The `/garden-room` page has comprehensive structured data (FAQPage, Product, BreadcrumbList, WebPage), optimized meta tags, and proper heading hierarchy.

**Independent Test**: View page source, verify JSON-LD contains all 4 schema types. Check title < 70 chars, description < 160 chars, OG + Twitter tags present. Paste JSON-LD into Google Rich Results Test.

### Implementation for User Story 6

- [X] T009 [US6] Update the `/garden-room` route entry in `apps/web/src/routes-metadata.ts`. Changes: (1) **Title**: Change to `"Garden Rooms Ireland | Steel Frame from 15m² to 45m²"` (under 70 chars). (2) **Description**: Change to `"Premium steel-frame garden rooms in 15m², 25m², 35m² & 45m² sizes. No planning permission needed up to 25m². Built in Dublin. Free quote."` (under 160 chars). (3) **Open Graph**: Update `og:title` to match the new title, `og:description` to match the new description. Keep existing `og:image`, `og:url`, `og:type`. (4) **Twitter**: Update `twitter:title` and `twitter:description` to match. (5) **Product schema**: Update the existing Product schema `data` object to include an `offers` array with 4 entries — one for each size (15m², 25m², 35m², 45m²). Each offer should have `@type: "Offer"`, `name` (e.g., "15m² Compact Studio"), `priceCurrency: "EUR"`, `availability` ("InStock" for 15m²/25m², "PreOrder" for 35m²/45m²), and `url` pointing to the contact page with product param. (6) **FAQPage schema**: Add a new entry to the `schema` array with `type: 'FAQPage'` and `data` containing a `mainEntity` array. Import or inline the 6 FAQ Q&A pairs (must match the same questions/answers used in `GARDEN_ROOM_FAQS` from `garden-room-data.ts`). Each item: `{ "@type": "Question", "name": "question text", "acceptedAnswer": { "@type": "Answer", "text": "answer text" } }`. (7) Ensure `generatePageSchema()` still produces BreadcrumbList and WebPage — no changes needed there.

**Checkpoint**: Structured data for all 4 schema types validates correctly. Meta tags are SEO-optimized.

---

## Phase 5: User Story 2 — Learn About Planning Permission (Priority: P2)

**Goal**: Visitors see a clear planning permission guide section with current exemptions, pending legislation, and "we handle paperwork" messaging.

**Independent Test**: Load `/garden-room`, scroll to Section 4, verify two-column layout with image + planning permission content. Verify "Learn More" link navigates to external resource.

### Implementation for User Story 2

- [X] T010 [US2] Add Section 4 (Planning Permission) to `apps/web/src/routes/GardenRoom.tsx`. Import `TwoColumnSplitLayout` from `@modular-house/ui`. Insert after the Why Steel Frame section (or after Product Range if Section 3 hasn't been added yet — use a TODO placeholder for Section 3). Render `<TwoColumnSplitLayout>` with `backgroundColor="white"` and these props: `subtitle="PLANNING MADE SIMPLE"`, `title="Do You Need Planning Permission?"`, `description1` set to a paragraph explaining: "Under current Irish law, garden rooms up to 25m² are exempt from planning permission when they meet certain conditions. New legislation is being prepared to increase this threshold, which would allow garden rooms up to 45m² without planning permission." Then a formatted list: "✓ Up to 25m² — No planning permission needed / ✓ 35m² & 45m² — Legislation pending / ✓ We handle all paperwork for you". Set `image1Src="/resource/garden-room/garden-room5.png"` (plus WebP/AVIF variants), `image1Alt="Garden room with planning permission compliant design"`, `image1Width` and `image1Height` matching the actual image dimensions. Set `button1Text="Learn More About Planning"`, `button1Link="https://www.gov.ie/en/publication/planning-exemptions/"` (placeholder external URL — will be confirmed by client). Set `renderLink={renderLink}`.

**Checkpoint**: Planning permission section renders with image, content, and external link.

---

## Phase 6: User Story 3 — Evaluate Trust and Quality (Priority: P2)

**Goal**: Visitors see the "Why Steel Frame" feature grid, a gallery of completed projects, and customer testimonials.

**Independent Test**: Load `/garden-room`, verify Section 3 (feature grid with 4 icons), Section 5 (gallery with 6-8 images + lightbox), and Section 6 (testimonials with ratings) all render correctly.

### Implementation for User Story 3

- [ ] T011 [US3] Add Section 3 (Why Steel Frame) to `apps/web/src/routes/GardenRoom.tsx`. Import `FeatureSection` and `CustomIcons` from `@modular-house/ui`, and `GARDEN_ROOM_FEATURES` from `../data/garden-room-data`. Wrap in a `<div>` with beige background (use inline style `backgroundColor: '#F6F5F0'` or a CSS class). Render `<FeatureSection topHeading="WHY MODULAR HOUSE" mainHeading="Engineered for Performance" introText="..." features={GARDEN_ROOM_FEATURES} />`. The `GARDEN_ROOM_FEATURES` array should use `CustomIcons` for the `icon` field — check which icons are available in `packages/ui/src/components/CustomIcons/` and select 4 appropriate ones (e.g., precision/gear, speed/clock, energy/leaf, durability/shield). If exact matches don't exist, use the closest available icons. Insert this section between Section 2 (Product Range) and Section 4 (Planning Permission).

- [ ] T012 [US3] Add Section 5 (Gallery) to `apps/web/src/routes/GardenRoom.tsx`. Import `FullMassonryGallery` from `@modular-house/ui` and `GARDEN_ROOM_GALLERY` from `../data/garden-room-data`. Wrap in a `<div id="garden_room_gallery">` with beige background. Render `<FullMassonryGallery itemCount={GARDEN_ROOM_GALLERY.length} items={GARDEN_ROOM_GALLERY} title="Garden Room Projects" description="Explore our portfolio of precision-built garden sanctuaries. See how Modular House combines steel-frame engineering with architectural design to create high-performance spaces you can enjoy year-round." />`. Insert after Section 4 (Planning Permission).

- [ ] T013 [US3] Add Section 6 (Testimonials) to `apps/web/src/routes/GardenRoom.tsx`. Import `TestimonialGrid` from `@modular-house/ui` and `GARDEN_ROOM_TESTIMONIALS` from `../data/garden-room-data`. Render `<TestimonialGrid subTitle="WHAT OUR CLIENTS SAY" title="Trusted by Homeowners Across Ireland" testimonials={GARDEN_ROOM_TESTIMONIALS} />`. Insert after Section 5 (Gallery). This section gets a white background (default).

**Checkpoint**: Why Steel Frame, Gallery, and Testimonials sections all render. Gallery lightbox works.

---

## Phase 7: User Story 4 — Find Answers to Common Questions (Priority: P2)

**Goal**: Visitors see 6 FAQ items with answers. FAQPage schema is already in place from US6 (Phase 4).

**Independent Test**: Load `/garden-room`, scroll to Section 7, verify all 6 FAQ items render. Click each item to expand/collapse. Verify `aria-expanded` toggles correctly. Verify keyboard navigation (Tab to focus, Enter/Space to toggle).

### Implementation for User Story 4

- [ ] T014 [US4] Add Section 7 (FAQ) to `apps/web/src/routes/GardenRoom.tsx`. Import `AccordionFAQ` from `@modular-house/ui` and `GARDEN_ROOM_FAQS` from `../data/garden-room-data`. Wrap in a `<div>` with beige background (`backgroundColor: '#F6F5F0'`). Render `<AccordionFAQ title="FAQ" faqs={GARDEN_ROOM_FAQS} />`. Insert after Section 6 (Testimonials). Per research decision R-002, AccordionFAQ provides expandable/collapsible FAQ items with `aria-expanded`/`aria-controls` attributes as required by spec FR-011 and SC-006.

**Checkpoint**: FAQ section renders 6 expandable Q&A items with accordion behaviour. Items expand/collapse on click with `aria-expanded`/`aria-controls` attributes. Combined with US6, FAQPage schema matches the FAQ content.

---

## Phase 8: User Story 5 — Complete the Page Journey with CTA (Priority: P3)

**Goal**: Visitors reach a prominent bottom CTA section with a "Get a Free Quote" button and phone number.

**Independent Test**: Scroll to page bottom, verify CTA section renders with background image, heading, and button linking to `/contact`. Verify phone number is a clickable `tel:` link on mobile.

### Implementation for User Story 5

- [ ] T015 [US5] Add Section 8 (CTA) to `apps/web/src/routes/GardenRoom.tsx`. Import `ContactFormWithImageBg` from `@modular-house/ui`. Render `<ContactFormWithImageBg backgroundImage="/resource/landing_hero2.png" title={"Ready to Start Your\nGarden Room Project?"} />` with an `onSubmit` handler. For the `onSubmit`, follow the same pattern used in Landing.tsx — import and use the `apiClient.submitEnquiry()` method. If `ContactFormWithImageBg` doesn't support a phone number display, add a `<p>` element below the form with a clickable `tel:+353XXXXXXXXX` link styled in white text. Insert as the final section before the closing `</div>`.

**Checkpoint**: Bottom CTA section renders. Form submission works. Phone number is clickable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Ensure all 8 sections are correctly ordered, backgrounds alternate properly, and the full page meets visual/responsive/accessibility requirements.

- [ ] T016 Review the final section ordering in `apps/web/src/routes/GardenRoom.tsx`. Ensure sections appear in this exact order: (1) Hero with dark overlay, (2) Product Range on white, (3) Why Steel Frame on beige #F6F5F0, (4) Planning Permission on white, (5) Gallery on beige #F6F5F0, (6) Testimonials on white, (7) FAQ on beige #F6F5F0, (8) CTA with dark overlay. Verify that each section wrapper has the correct background colour applied (either via component prop like `backgroundColor="white"`, inline style, or CSS class). Remove any TODO comments left from incremental development.

- [ ] T017 [P] Add section `id` attributes to each section wrapper in `apps/web/src/routes/GardenRoom.tsx` for anchor link navigation: `id="garden_room_hero"`, `id="product-range"`, `id="why-steel-frame"`, `id="planning-permission"`, `id="garden-room-gallery"`, `id="testimonials"`, `id="faq"`, `id="contact-cta"`. Verify the hero "Explore Our Ranges" link scrolls smoothly to `#product-range`.

- [ ] T018 [P] Run `pnpm --filter @modular-house/web optimise:images` to ensure all images in `/public/resource/garden-room/` have WebP and AVIF variants. Verify that every image referenced in `garden-room-data.ts` has matching `.webp` and `.avif` files.

- [ ] T019 Perform responsive testing of `apps/web/src/routes/GardenRoom.tsx`. Check at 3 breakpoints: (1) Desktop 1440px — product cards in 4 columns, features in 4 columns, two-column planning layout side-by-side. (2) Tablet 768px — product cards in 2 columns, features stack or 2 columns, planning layout stacks. (3) Mobile 375px — all content single column, no horizontal overflow, text readable, CTAs full-width. Fix any layout issues found. Also verify at 320px (narrow) and 2560px (ultra-wide, content should be centred in max-width container).

- [ ] T020 Perform accessibility review of the page. Check: (1) Heading hierarchy — one `<h1>` in hero, each section has `<h2>`, product cards use `<h3>`. (2) All images have descriptive `alt` text. (3) All CTA buttons/links are keyboard-focusable with visible focus indicators. (4) Product card badges have sufficient colour contrast. (5) FAQ accordion items have correct `aria-expanded` and `aria-controls` attributes; expand/collapse works via keyboard (Enter/Space). (6) Gallery lightbox is keyboard-navigable (Escape to close, arrow keys). (7) Page is navigable via Tab key from top to bottom without getting trapped.

- [ ] T021 Run `pnpm test` to verify all existing tests still pass and the new ProductRangeGrid tests pass. Then run `pnpm --filter @modular-house/web build` to verify the SSG/prerender build completes without errors for the updated `/garden-room` route.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — creates new component + shared data
- **Phase 3 (US1 — Product Range)**: Depends on Phase 2 (needs ProductRangeGrid + product data)
- **Phase 4 (US6 — SEO)**: Depends on Phase 2 (needs FAQ data for schema) — can run in parallel with Phase 3
- **Phase 5 (US2 — Planning)**: Depends on Phase 2 — can run in parallel with Phases 3/4
- **Phase 6 (US3 — Trust)**: Depends on Phase 2 — can run in parallel with Phases 3/4/5
- **Phase 7 (US4 — FAQ)**: Depends on Phase 2 — can run in parallel with others
- **Phase 8 (US5 — CTA)**: Depends on Phase 2 — can run in parallel with others
- **Phase 9 (Polish)**: Depends on ALL user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Independent. Can start immediately after Phase 2.
- **US6 (P1)**: Independent. Can start immediately after Phase 2. Does not depend on US1.
- **US2 (P2)**: Independent. Can start after Phase 2.
- **US3 (P2)**: Independent. Can start after Phase 2.
- **US4 (P2)**: Independent. Can start after Phase 2. (FAQ data from Phase 2 already created.)
- **US5 (P3)**: Independent. Can start after Phase 2.

All user stories modify `GardenRoom.tsx`, so in practice they should be done **sequentially** to avoid merge conflicts. Recommended order: US1 → US6 → US3 → US2 → US4 → US5.

### Parallel Opportunities

Within Phase 2:
- T002-T005 are sequential (component → CSS → export → tests)
- T006 can run in parallel with T002-T005 (different file)

Within Phase 6 (US3):
- T011, T012, T013 all modify GardenRoom.tsx — execute sequentially to avoid merge conflicts

Within Phase 9:
- T017 and T018 can run in parallel (different concerns)

---

## Parallel Example: Phase 2

```bash
# These can run in parallel (different files):
Task T002-T005: ProductRangeGrid component (packages/ui)
Task T005a-T005c: AccordionFAQ component (packages/ui)
Task T006: Shared data constants (apps/web/src/data/garden-room-data.ts)

# Note: T004 (exports) depends on both T002 and T005a completing first
```

## Parallel Example: Phase 9

```bash
# These can run in parallel:
Task T017: Add section id attributes (GardenRoom.tsx)
Task T018: Run image optimisation script (CLI command)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 6 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (ProductRangeGrid + data)
3. Complete Phase 3: US1 — Hero + Product Range + Contact query params
4. Complete Phase 4: US6 — SEO metadata + structured data
5. **STOP and VALIDATE**: The page shows hero + product cards with working CTAs and full SEO markup. This is a functional, deployable MVP.

### Full Delivery

1. Complete MVP (Phases 1-4)
2. Add US3 (Phase 6): Why Steel Frame + Gallery + Testimonials
3. Add US2 (Phase 5): Planning Permission section
4. Add US4 (Phase 7): FAQ section
5. Add US5 (Phase 8): Bottom CTA section
6. Complete Phase 9: Polish, responsive testing, accessibility review, build validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- The `garden-room-data.ts` file is the single source of truth for all page content — updating copy, images, or product availability requires only data changes, not component changes
- FAQ data is referenced both by the AccordionFAQ component AND the FAQPage schema — keep them in sync via the shared constant
- The contact page query param support (T008) is part of US1 because it completes the product card → contact conversion flow
