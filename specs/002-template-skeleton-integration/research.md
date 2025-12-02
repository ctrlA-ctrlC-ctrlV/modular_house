# Research: Template–Skeleton Integration

## Decisions

- Decision: Integrate `.template/rebar` styles via global import and scoped wrapper
  - Rationale: Fastest path to achieve consistent layout/typography without rewriting components; scoping via a wrapper class (e.g., `.theme-rebar`) prevents unintended bleed and allows easy rollback.
  - Alternatives considered:
    - Fully port styles to CSS-in-JS: High effort; risk of regressions; not needed for Phase 1.
    - Import entire WP theme unscoped: Risk of conflicts with existing `index.css` and 3rd-party styles.

- Decision: Limit scope to public routes; exclude admin screens in this phase
  - Rationale: Aligns with FR-031; reduces risk and surface area; focuses on user-visible value.
  - Alternatives considered: Include admin now (higher risk, larger QA surface).

- Decision: `.template` is source of truth for branding tokens; extract to CSS variables
  - Rationale: Keeps branding consistent and centralized; enables future theming; minimal coupling to WP theme structure.
  - Alternatives considered: Keep tokens only in `index.css` (divergence risk); duplicate tokens across files (maintenance risk).

- Decision: Asset strategy – copy used assets to `apps/web/public/template/` and reference relatively
  - Rationale: Keeps bundler-friendly paths and cache-control; avoids runtime fetch from WP structure.
  - Alternatives considered: Import via CSS `url()` from outside app root (not supported by Vite without custom config).

- Decision: Reversibility via scoped layout wrapper
  - Rationale: Avoids global CSS overrides; fallback by swapping `Layout` to non-templated version.
  - Alternatives considered: Feature flag toggling stylesheet import (bundle still includes CSS; limited win).

- Decision: Testing – add rendering tests per route and focus-state checks
  - Rationale: Ensures no regressions in behavior and preserves accessibility affordances.
  - Alternatives considered: Visual regression tooling (deferred; adds infra complexity).

- Decision: Performance – import minimal CSS and defer non-critical assets
  - Rationale: Protect LCP budget (<2.5s). Load fonts async; include critical styles early.
  - Alternatives considered: Full PurgeCSS pass now (risk of removing needed classes; defer to later phase with safelist).

## Best Practices

- CSS loading order: Template CSS first, app overrides after. Keep `index.css` lean.
- Class naming: Use template's `c-`, `l-`, `u-` prefixes consistently. Avoid global element selectors in new code.
- Accessibility: Verify focus indicators, color contrast, and ARIA attributes on interactive components after applying classes.
- Layout: Centralize header/footer/nav in a single `Layout` component to ensure consistent structure.
- Assets: Co-locate images and fonts under `public/template/` and reference with absolute paths (`/template/...`).

## Implementation Notes

- Create `apps/web/src/styles/tokens.css` with CSS variables derived from `.template/rebar/style.scss` (colors, spacing, typography).
- Create `apps/web/src/styles/template.css` (compiled from selected `.template` CSS) and import in `main.tsx` before `index.css`.
- Introduce `Layout` component that applies `.theme-rebar` root class and renders header/footer using template classes.
- Update public routes (`/`, `/about`, `/gallery`, `/contact`, `/garden-room`, `/house-extension`, `/terms`, `/privacy`, `/404`) to use `Layout` wrapper.
- Keep admin routes on existing layout to avoid scope creep.

## Open Questions (resolved)

- FR-031: Restrict to public pages only → Yes (admin excluded).
- FR-032: Source of truth for tokens → `.template` extracted into CSS variables used by the app.

## Template Component Catalog (Phase 0 – T000)

Checklist:

- [X] Source Paths Scanned: `.template/rebar`, `.template/rebar-child` (or equivalent)
- [X] Extraction Method Noted (manual tree listing)
- [X] For each component recorded core attributes
- [X] Deprecated or placeholder components marked
- [X] Naming anomalies noted
- [X] Summary by category provided
- [X] High-complexity components listed (heuristic: > 250 LOC or > 8 key props)
- [X] Required bootstrapping components identified

Extraction Method:

- Manual tree review of `.template/rebar` and `.template/rebar-child` focusing on layout, structural, interactive, data, and styling-hook assets. Components are identified by file stems and mapped to roles and dependencies. Where exact props are not applicable (non-TS/JS assets), key configuration or usage notes are recorded instead.

Summary by Category:

- Layout: 3
- Structural: 4
- Interactive: 3
- Data: 1
- Styling-hook: 3

High-Complexity Components:

- Header (layout; composite; many regions and menu states)
- Footer (layout; composite; multiple columns and responsive states)
- Gallery (interactive; modal/lightbox behavior)

Required Bootstrapping Components:

- AppShell / Root Layout wrapper (applies `.theme-rebar` and mounts header/footer)
- Typography tokens (CSS variables) and base template stylesheet import order

| Component | Path | Category | Role | Dependencies | Key Props | Reusable? | Style Coupling | Side Effects | Portability Notes |
| --------- | ---- | -------- | ---- | ------------ | --------- | --------- | -------------- | ------------ | ----------------- |
| Header | `.template/rebar/header.php` | layout | composite | menu scripts, typography | nav items, brand | portable | global | event listeners | Requires wrapper `.theme-rebar`; convert PHP regions to React components |
| Footer | `.template/rebar/footer.php` | layout | composite | typography, grid | columns, links | portable | global | none | Map to React JSX; ensure link semantics |
| AppShell | `.template/rebar-child/functions.php` | structural | root | header, footer | regions | context-bound | global | none | Transpose to `TemplateLayout.tsx` applying root class |
| Container Utility | `.template/rebar/assets/css/utilities.css` | styling-hook | leaf | none | width, padding | portable | module | none | Use class `l-container` on top-level wrappers |
| Typography | `.template/rebar/assets/css/typography.css` | styling-hook | leaf | fonts | size, weight | portable | module | font load | Extract tokens into `tokens.css`; defer font loading |
| Focus Helpers | `.template/rebar/assets/css/a11y.css` | styling-hook | leaf | none | focus-ring | portable | module | none | Ensure visible focus; validate via tests |
| Gallery | `.template/rebar/assets/js/gallery.js` | interactive | composite | lightbox, a11y | images | portable | inline/module | DOM events | Wrap in React component; add focus trap |
| Lightbox | `.template/rebar/assets/js/lightbox.js` | interactive | composite | a11y | open/close | portable | inline/module | focus management | Implement focus trap and restore in React |
| Skip Link | `.template/rebar/header.php` | interactive | leaf | main id | href | portable | none | focus jump | Provide `#main-content` target in layout |

Naming Anomalies:

- Mixed casing across utility classes; ensure consistent `c-`, `l-`, `u-` prefixes when applied in the app.

Deprecated/Placeholder Components:

- Legacy `ie.css` references ignored; not applicable for modern targets.

## Utility Catalog (Phase 0 – T001)

Taxonomy:

- Utilities: Pure functions or helper modules
- Containers: Stateful wrappers/providers (e.g., layout shells)
- Typography: Tokens, mixins, text components/styles
- Focus / Accessibility Helpers: A11y-specific styles/scripts

Aggregate Summary:

- Utilities: 2 (gallery helpers, lightbox helpers)
- Containers: 1 (AppShell / layout wrapper)
- Typography: 2 (tokens, base typography)
- Focus/A11y: 1 (focus rings/skip link styles)

Shared Constants / Design Tokens Referenced:

- Color palette, spacing scale, font families/weights from `.template/rebar/style.scss` → extracted into `apps/web/src/styles/tokens.css`

Duplicate Logic / Consolidation Candidates:

- Event handling across gallery/lightbox modules can be unified in a single React utility with consistent a11y handling.

Framework Coupling Notes:

- Containers map to React layout component; avoid global event bus reliance.
- Utilities should be tree-shakable and side-effect free where possible.

Global Namespace Usage:

- Legacy scripts may attach to `window`; refactor to module scope when porting.

| Name | Type | Path | Purpose | Signature / IO | Dependencies | Side Effects | Tree-shakable | Env Constraints | Portability Risk |
| ---- | ---- | ---- | ------- | -------------- | ------------ | ------------ | ------------- | --------------- | ---------------- |
| GalleryUtils | util | `.template/rebar/assets/js/gallery.js` | Image grid and modal helpers | `(images: Element[]) => { open(id: string): void; close(): void }` | DOM APIs | DOM events, focus changes | yes (after refactor) | browser-only | medium |
| LightboxUtils | util | `.template/rebar/assets/js/lightbox.js` | Open/close lightbox, focus trap | `{ open(target: Element): void; close(): void }` | DOM APIs, a11y helpers | Focus management | yes (after refactor) | browser-only | medium |
| AppShell | container | `.template/rebar-child/functions.php` | Root shell mounting header/footer regions | `({ children }: { children: React.ReactNode }) => JSX.Element` (target React) | header/footer components | none | yes | browser & Node (SSR-compatible if pure) | low |
| TypographyBase | token | `.template/rebar/assets/css/typography.css` | Base typographic scales and classes | `CSS variables: --font-size-*, --line-height-*` | fonts | font loading | n/a | browser-only | low |
| DesignTokens | token | `.template/rebar/style.scss` | Brand colors, spacing, font tokens | `CSS variables: --color-*, --space-*` | none | none | n/a | browser-only | low |
| A11yFocus | a11y | `.template/rebar/assets/css/a11y.css` | Visible focus rings, skip-link styling | `CSS classes: .u-focus-ring, .skip-link` | none | none | n/a | browser-only | low |

Risk Profile Summary:

- Highest risk in interactive utilities due to DOM coupling; mitigate by wrapping in React components and isolating effects.
- Tokens and typography are low risk; ensure import order to avoid override conflicts.

## Per-Page Mapping (Phase 0 – T002)

### Page: Home / Route "/"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/Landing.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, Hero, Sections, Footer` |
| Data Sources | None (static content) |
| State Providers | `QueryClientProvider` (global, if present) |
| Critical Styles | `template.css`, `index.css`, `tokens.css` |
| Scripts / Effects | Minimal mount effects (none critical) |
| Performance Notes | Lazy load heavy media; memoize hero where needed |
| Accessibility | Landmarks via header/footer; focus indicators on links |
| Portability Constraints | Requires React Router; client-side render |
| Cross-cutting | Analytics wrapper if present; public auth guard none |
| Error / Empty States | N/A |
| Tests | `apps/web/src/test/routes/template-layout.test.tsx` |
| Refactor Targets | Consolidate duplicate section styles to template classes |

### Page: About / Route "/about"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/About.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, ContentSections, Footer` |
| Data Sources | None |
| State Providers | None beyond global |
| Critical Styles | `template.css`, `index.css` |
| Scripts / Effects | None |
| Performance Notes | Static; ensure minimal re-render |
| Accessibility | Semantic headings; link focus |
| Portability Constraints | None beyond layout coupling |
| Cross-cutting | Analytics |
| Error / Empty States | N/A |
| Tests | `apps/web/src/test/routes/template-layout.test.tsx` |
| Refactor Targets | Apply `l-container` utility consistently |

### Page: Gallery / Route "/gallery"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/Gallery.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, GalleryGrid, Lightbox, Footer` |
| Data Sources | Local image assets under `/public/template/` |
| State Providers | Local component state; optional context for lightbox |
| Critical Styles | `template.css` gallery classes; `a11y.css` focus trap |
| Scripts / Effects | Lightbox open/close; focus management |
| Performance Notes | Defer non-critical images; use `loading="lazy"` |
| Accessibility | Alt text on images; focus trap in modal |
| Portability Constraints | Browser-only DOM for lightbox |
| Cross-cutting | Analytics events on image open |
| Error / Empty States | Empty gallery state message |
| Tests | `apps/web/src/test/accessibility/lightbox-focus.test.tsx` |
| Refactor Targets | Unify event handlers in reusable utility |

### Page: Contact / Route "/contact"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/Contact.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, ContactForm, Footer` |
| Data Sources | None (client-side validation) |
| State Providers | Form state local |
| Critical Styles | Form controls via template classes |
| Scripts / Effects | Validation, error rendering |
| Performance Notes | Minimal; avoid heavy libs |
| Accessibility | `aria-describedby` on errors; labeled inputs |
| Portability Constraints | None beyond layout |
| Cross-cutting | Analytics form submission events |
| Error / Empty States | Error messages on invalid input |
| Tests | `apps/web/src/test/accessibility/form-errors.test.tsx` |
| Refactor Targets | Centralize form error component |

### Page: Privacy / Route "/privacy"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/Privacy.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, PolicyContent, Footer` |
| Data Sources | Static text |
| State Providers | None |
| Critical Styles | Typography classes |
| Scripts / Effects | None |
| Performance Notes | Static |
| Accessibility | Semantic lists/headings |
| Portability Constraints | None |
| Cross-cutting | Analytics |
| Error / Empty States | N/A |
| Tests | Route render part of layout tests |
| Refactor Targets | Normalize heading styles via tokens |

### Page: Terms / Route "/terms"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/Terms.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, TermsContent, Footer` |
| Data Sources | Static text |
| State Providers | None |
| Critical Styles | Typography classes |
| Scripts / Effects | None |
| Performance Notes | Static |
| Accessibility | Semantic content sections |
| Portability Constraints | None |
| Cross-cutting | Analytics |
| Error / Empty States | N/A |
| Tests | Route render tests |
| Refactor Targets | Shared content section component |

### Page: Not Found / Route "*"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/not-found.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, NotFoundMessage, Footer` |
| Data Sources | None |
| State Providers | None |
| Critical Styles | Utility classes for spacing/typography |
| Scripts / Effects | None |
| Performance Notes | Minimal |
| Accessibility | Clear focus target on main content |
| Portability Constraints | None |
| Cross-cutting | Analytics page event |
| Error / Empty States | N/A |
| Tests | Route render tests |
| Refactor Targets | Shared message component |

### Page: Garden Room / Route "/garden-room"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/GardenRoom.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, ContentSections, Footer` |
| Data Sources | Static + images |
| State Providers | None |
| Critical Styles | Container utility, typography |
| Scripts / Effects | None |
| Performance Notes | Lazy images |
| Accessibility | Alt text |
| Portability Constraints | None |
| Cross-cutting | Analytics |
| Error / Empty States | N/A |
| Tests | Route render tests |
| Refactor Targets | Reuse sections from Landing |

### Page: House Extension / Route "/house-extension"
| Aspect | Detail |
| --- | --- |
| Entry File | `apps/web/src/routes/HouseExtension.tsx` |
| Layout Chain | `TemplateLayout > AppShell > Page` |
| Core Components | `Header, ContentSections, Footer` |
| Data Sources | Static + images |
| State Providers | None |
| Critical Styles | Container utility, typography |
| Scripts / Effects | None |
| Performance Notes | Lazy images |
| Accessibility | Alt text |
| Portability Constraints | None |
| Cross-cutting | Analytics |
| Error / Empty States | N/A |
| Tests | Route render tests |
| Refactor Targets | Shared reusable sections |

At end:

- Aggregate matrix: shared layout components across all pages (Header, Footer, TemplateLayout)
- Shared layout components identified: `TemplateLayout`, `Header`, `Footer`
- Highest portability friction: Gallery (interactive DOM/lightbox)
