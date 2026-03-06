# Implementation Plan: Garden Room Page Redesign

**Branch**: `008-garden-room-redesign` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-garden-room-redesign/spec.md`

## Summary

Redesign the `/garden-room` page from a 2-section layout (hero + gallery) into an 8-section product-led page showcasing the new standardized product line (15m², 25m², 35m², 45m²). Two new UI components will be created in `packages/ui`: `ProductRangeGrid` (product card grid) and `AccordionFAQ` (expandable FAQ section). The remaining 6 sections reuse existing components (`HeroBoldBottomText`, `FeatureSection`, `TwoColumnSplitLayout`, `FullMassonryGallery`, `TestimonialGrid`, `ContactFormWithImageBg`). SEO enhancements include FAQPage, Product, BreadcrumbList, and WebPage structured data schemas, plus updated meta tags. The contact page will be extended to read query parameters for product pre-selection.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18.3
**Primary Dependencies**: react-router-dom 6.28, react-helmet-async 2.0.5, Vite 6.0, @modular-house/ui (shared component library)
**Storage**: N/A (static content, no database)
**Testing**: Vitest (unit), manual visual testing for responsive layout
**Target Platform**: Web (SSG pre-rendered, all modern browsers + iOS Safari)
**Project Type**: pnpm monorepo web application (apps/web + packages/ui)
**Performance Goals**: LCP < 2.5s on 4G; all images optimized (AVIF/WebP/PNG chain); hero image eager-loaded
**Constraints**: WCAG 2.1 AA compliance; SEO structured data must pass Google Rich Results validator; visual consistency with existing Landing page
**Scale/Scope**: 1 page redesign, 2 new components, ~8 files modified, ~6 files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security & Privacy First | PASS | No user data handling beyond existing contact form (GDPR consent already implemented). No new auth/data-access surfaces. |
| II. Reliability & Observability | PASS | Frontend-only change; no new deployable services. Existing health endpoints unaffected. Structured JSON logs not applicable (static page). |
| III. Test Discipline | PASS | New ProductRangeGrid component will have unit tests. Schema validation will be tested. Existing component tests remain passing. |
| IV. Performance & Efficiency | PASS | LCP budget < 2.5s maintained via OptimizedImage priority loading on hero. Lazy loading for below-fold images. Performance budget documented above. |
| V. Accessibility & Inclusive UX | PASS | All interactive elements (FAQ accordion, gallery lightbox, product card CTAs) will use semantic HTML, keyboard navigation, focus indicators, and ARIA attributes. New AccordionFAQ component implements `aria-expanded`/`aria-controls` for expandable FAQ items. |
| Additional Constraints | PASS | No API/schema version changes. Dependencies already pinned. |
| Development Workflow | PASS | PR will link spec, pass CI, confirm performance/accessibility budgets. |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/008-garden-room-redesign/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: entity model
├── quickstart.md        # Phase 1: implementation quickstart
├── contracts/           # Phase 1: component interfaces
│   ├── product-range-grid.md
│   └── accordion-faq.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/ui/src/components/
├── ProductRangeGrid/                    # NEW component
│   ├── ProductRangeGrid.tsx             # Component implementation
│   ├── ProductRangeGrid.css             # BEM-styled CSS
│   └── ProductRangeGrid.test.tsx        # Unit tests
│
├── AccordionFAQ/                        # NEW component
│   ├── AccordionFAQ.tsx                 # Expandable FAQ with aria-expanded
│   ├── AccordionFAQ.css                 # BEM-styled CSS with transitions
│   └── AccordionFAQ.test.tsx            # Unit tests
│
├── HeroBoldBottomText/                  # EXISTING (no changes)
├── FeatureSection/                      # EXISTING (no changes)
├── TwoColumnSplitLayout/               # EXISTING (no changes)
├── FullMassonryGallery/                 # EXISTING (no changes)
├── TestimonialGrid/                     # EXISTING (no changes)
├── MiniFAQs/                            # EXISTING (no changes)
├── ContactFormWithImageBg/              # EXISTING (no changes)
└── OptimizedImage/                      # EXISTING (no changes)

packages/ui/src/index.ts                 # ADD export for ProductRangeGrid

apps/web/src/
├── routes/
│   └── GardenRoom.tsx                   # REWRITE: 2 sections → 8 sections
├── routes-metadata.ts                   # UPDATE: enhanced schema + meta tags
└── routes/Contact.tsx                   # UPDATE: read query params for pre-selection
```

**Structure Decision**: Monorepo web application. New component goes in shared `packages/ui` to maintain consistency with existing architecture. Page assembly happens in `apps/web/src/routes/GardenRoom.tsx`. SEO metadata updated in the existing centralized `routes-metadata.ts`.

## Complexity Tracking

No violations to justify. All gates pass cleanly.
