# Implementation Plan: SEO Maximization

**Branch**: `005-seo-maximization` | **Date**: January 8, 2026 | **Spec**: [specs/005-seo-maximization/spec.md](specs/005-seo-maximization/spec.md)
**Input**: Feature specification from `/specs/005-seo-maximization/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements SEO best practices for the modular house web application. It transitions the application to use Static Site Generation (SSG) to ensure all public pages are pre-rendered for instant loading and crawler accessibility. It also adds `sitemap.xml`, `robots.txt`, comprehensive meta tags, and JSON-LD structured data for rich search results.

## Technical Context

**Language/Version**: TypeScript ^5.6.3+
**Primary Dependencies**: React ^18.3.1, Vite ^5.4.11, React Helmet Async ^2.0.5
**New Dependencies**: SSG Tool (utilize Vite's native SSR build capability (`ssr: true` in config) to generate a server bundle, and then run a node script (`scripts/prerender.ts`) to generate static HTML files), Sitemap Generator (generates during the prerender step)
**Storage**: N/A (Static Files)
**Testing**: Vitest
**Target Platform**: Web (Static Hosting)
**Project Type**: Web Application (`apps/web`)
**Performance Goals**: FCP < 1.8s, Lighthouse SEO 100/100, Lighthouse Performance > 90
**Constraints**: Must work with existing `react-router-dom` setup if possible.
**Scale/Scope**: ~5-10 public static pages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following MUST be documented (or explicitly marked N/A) before proceeding:

1. **Security & Privacy**:
   - **Threat Model**: Static files reduce attack surface. No new user data collected.
   - **Data Classification**: Public data only.
   - **Secrets**: N/A for static build.

2. **Reliability & Observability**:
   - **Health**: N/A (Static files).
   - **Logs**: N/A (Client-side only, build logs for generation success).
   - **Metrics**: Build success/failure, Page size tracking (optional).

3. **Test Discipline**:
   - **Strategy**: Unit tests for SEO components (Schema/Meta). Integration tests to verify build output contains expected HTML/Tags.
   - **Coverage**: 100% logic coverage for SEO helpers.

4. **Performance & Efficiency**:
   - **Budgets**: FCP < 1.8s.
   - **Measurement**: Lighthouse CI or local audit script.

5. **Accessibility & Inclusive UX**:
   - **WCAG**: Semantic HTML (FR-005). Alt text (FR-006).

## Project Structure

### Documentation (this feature)

```text
specs/005-seo-maximization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for SEO usually, unless mocking crawler contract)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── components/
│   │   └── seo/
│   │       ├── SEOHead.tsx        # Meta tags wrapper
│   │       └── StructuredData.tsx # JSON-LD wrapper
│   ├── lib/
│   │   └── seo-constants.ts
│   └── main.tsx                   # Update for hydration
├── prerender.ts (or similar)      # SSG Script
├── sitemap-generator.ts           # Sitemap Script
└── public/
    ├── robots.txt
    └── sitemap.xml
```

**Structure Decision**: Integrated directly into `apps/web`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| SSG Implementation | FR-008 Mandatory Requirement | Plain SPA has poor SEO and performance metrics. |
