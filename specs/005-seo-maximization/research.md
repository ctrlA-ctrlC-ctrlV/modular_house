# Research: SEO Maximization Strategy

**Date**: January 8, 2026
**Branch**: `005-seo-maximization`

## SSG Implementation Strategy

### Decision
**Implement a Custom Server-Build Prerender Script.**

We will NOT use a heavy framework like Next.js or Vike (vite-plugin-ssr). Instead, we will utilize Vite's native SSR build capability (`ssr: true` in config) to generate a server bundle, and then run a node script (`scripts/prerender.ts`) to generate static HTML files.

### Rationale
1.  **Minimal disruption**: Keeps the current `apps/web` structure (Vite + React Router) almost entirely intact.
2.  **Tech Stack alignment**: Uses standard `react-dom/server` and `react-router-dom/server` which are already available or peer dependencies.
3.  **Control**: We own the generation logic, which makes handling `react-helmet-async` and `sitemap.xml` generation trivial in the same pass.
4.  **Performance**: Faster build times than headless-browser based crawlers (`react-snap`).

### Alternatives Considered
- **`vite-ssg`**: Primary focus is Vue. React support is community-maintained and less stable.
- **`react-snap` / `puppeteer`**: Flaky, slow, and adds heavy browser dependencies to the build pipeline.
- **Next.js**: Total rewrite of the application structure. Too high cost for this feature.

## Sitemap & Robots Strategy

### Decision
Generate `sitemap.xml` and `robots.txt` programmatically during the `prerender` step.

### Rationale
Since the prerender script already iterates over all valid routes to generate HTML, it is the single source of truth for "what pages exist". Generating the sitemap in the same loop ensures 100% consistency between generated pages and the sitemap.

## Schema / JSON-LD Strategy

### Decision
Use a shared `StructuredData` component that takes a strongly-typed schema object (Product, LocalBusiness) and renders a `<script type="application/ld+json">` tag via `react-helmet-async`.

### Rationale
Encapsulates complexity. Using `react-helmet-async` ensures the script is placed in the `<head>` and managed correctly during both hydration and server-rendering.
