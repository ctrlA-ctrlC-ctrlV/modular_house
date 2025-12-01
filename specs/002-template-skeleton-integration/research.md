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
