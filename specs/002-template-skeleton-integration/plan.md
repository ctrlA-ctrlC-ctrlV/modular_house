# Implementation Plan: Template–Skeleton Integration

**Branch**: `002-template-skeleton-integration` | **Date**: 2025-12-01 | **Spec**: `specs/002-template-skeleton-integration/spec.md`
**Input**: Feature specification from `/specs/002-template-skeleton-integration/spec.md`

**Note**: Generated and maintained via `/speckit.plan` workflow.

## Summary

Integrate the WordPress-based template assets from `.template/rebar` (and child) into the existing web skeleton (`apps/web`) without altering backend behavior or foundational project structure. Apply the template’s layout (header, footer, container), typography, and utility classes across public pages while preserving accessibility and enabling a reversible fallback to current styles.

## Technical Context

**Language/Version**: TypeScript 5.x (Vite 6, React 18); Node.js (API)  
**Primary Dependencies**: Frontend: React, React Router, Vite; Testing: Vitest + RTL; Styling via imported template CSS/SCSS  
**Storage**: PostgreSQL via Prisma (API); not impacted by this feature  
**Testing**: Vitest + @testing-library/react (frontend), existing API tests unaffected  
**Target Platform**: Web (SPA, `apps/web`), API: Node/Express-like (`apps/api`)  
**Project Type**: Web frontend + API backend (monorepo with PNPM workspaces)  
**Performance Goals**: LCP < 2.5s (frontend), API p95 < 300ms (unchanged)  
**Constraints**: Reversible integration; no breaking changes to routes/behavior; adhere to WCAG 2.1 AA  
**Scale/Scope**: Public-facing routes only in this phase; admin excluded

NEEDS CLARIFICATION resolved in Phase 0 research: 
- FR-031: Restrict to public pages only (admin excluded for this phase).  
- FR-032: `.template` is the source of truth for branding tokens; extract CSS variables in `apps/web/src/styles/tokens.css` and keep `index.css` as minimal glue.

## Constitution Check

Must pass before Phase 0 research; re-check after Phase 1 design.

1. Security & Privacy: No new data flows. No secrets added. Frontend-only styling; API untouched. Threat model unchanged; ensure no PII is introduced in logs or client bundles. Status: PASS (N/A for new data).
2. Reliability & Observability: API health/log schema unchanged. Frontend: no runtime logging added. Status: PASS (N/A for new endpoints).
3. Test Discipline: Add component/page rendering tests validating template class application and no route regressions; maintain coverage ≥70% for changed modules. Status: PASS (plan defined).
4. Performance & Efficiency: Ensure CSS loading is non-blocking where feasible; bundle budgets checked in build output; LCP target <2.5s. Status: PASS (plan defined).
5. Accessibility & Inclusive UX: Preserve keyboard navigation, focus indicators, aria-labels; verify color contrast. Status: PASS (plan defined).

Exceptions: None required at this phase.

### Post-Design Re-check

All gates remain PASS after Phase 1 design. No new risks introduced. Accessibility and performance budgets are accounted for in the plan; observability/security unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/002-template-skeleton-integration/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (decisions & rationale)
├── data-model.md        # Phase 1 output (entities/relationships for styling system)
├── quickstart.md        # Phase 1 output (how to apply/extend template)
└── contracts/           # Phase 1 output (OpenAPI: N/A endpoints; minimal stub)
```

### Source Code (repository root)

```text
apps/
├── api/                 # Backend (Node/TS, Prisma) – no changes in this phase
└── web/                 # Frontend (React/Vite/TS) – template integration here
    ├── src/
    │   ├── components/  # Header, Footer, Layout wrappers adopting template classes
    │   ├── routes/      # Public pages updated to use layout/utilities
    │   ├── styles/      # tokens.css, template.css (compiled/imported)
    │   └── main.tsx     # Global style imports ordering (template before app overrides)
    └── public/          # Copied static assets (images/fonts) from `.template`

.template/
├── rebar/               # Source template (WP theme) – assets/styles mapped
└── rebar-child/         # Child overrides (if any) – reviewed for portability
```

**Structure Decision**: Web + API monorepo structure retained. All changes localized to `apps/web` and docs under `specs/002-template-skeleton-integration`. No new packages introduced.

## Complexity Tracking

N/A – No constitution gate violations or structural complexity increases.
