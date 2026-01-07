# SEO Maximization Action Plan

## 1. Project Goal (SMART)

**Goal:** Establish a technical SEO foundation to achieve **100% crawlability** of public pages and improve organic search visibility for key service terms ("Garden Room", "House Extension").

*   **Specific:** Fix identified technical deficiencies (missing sitemap, broken meta tags, invisible links) and implement rich structured data.
*   **Measurable:**
    *   Google Search Console shows 0 "Excluded" pages due to crawl errors.
    *   All service pages render valid JSON-LD Rich Snippets in the Rich Results Test.
    *   Lighthouse SEO score reaches 100/100 on all core routes.
*   **Achievable:** The codebase is modern (React/Vite) and the discovered issues are well-defined technical debt, not architectural blockers.
*   **Relevant:** Organic search is a primary lead generation channel for high-value construction services.
*   **Time-bound:** All "Critical" and "High" priority tasks to be completed within the current sprint. Full plan completion in next sprint.

---

## 2. Action Plan & Task List

### Phase 1: Critical Fixes (Indexability & Bugs)
**Urgency:**  Immediate
**Objective:** Ensure search engines can actually find and understand the existing pages.

#### Task 1.1: Create `robots.txt`
*   **Description:** The site currently lacks directives for crawlers. We must explicitly allow access to public areas and block admin areas to preserve crawl budget.
*   **Action:** Create `apps/web/public/robots.txt`.
*   **Content:**
    ```text
    User-agent: *
    Allow: /
    Disallow: /admin/
    Sitemap: https://modularhouse.ie/sitemap.xml
    ```
*   **Verification:** Navigate to `localhost:3000/robots.txt` and verify it serves correctly.

#### Task 1.2: Generate `sitemap.xml`
*   **Description:** Crawlers rely on a sitemap to discover pages in SPAs efficiently.
*   **Action:**
    1.  Install `vite-plugin-sitemap` (or implement a script to generate it).
    2.  Configure it to include all static routes: `/`, `/about`, `/contact`, `/gallery`, `/garden-room`, `/house-extension`, `/privacy`, `/terms`.
    3.  Exclude admin routes.
*   **Verification:** Build the project and inspect `dist/sitemap.xml`.

#### Task 1.3: Fix `Gallery.tsx` Empty Metadata
*   **Description:** The Gallery page currently calls `<Seo />` with no props, resulting in a blank or default title. This is a critical missed opportunity for "Modular House Gallery" keywords.
*   **Action:** Update `apps/web/src/routes/Gallery.tsx`.
*   **Implementation:**
    ```tsx
    <Seo
      title="Project Gallery | Bespoke Garden Rooms & Extensions"
      description="Explore our portfolio of completed steel frame garden rooms and house extensions across Dublin and Ireland."
      canonicalUrl="https://modularhouse.ie/gallery"
    />
    ```

#### Task 1.4: Fix Broken Schema Injection in Service Pages
*   **Description:** `GardenRoom.tsx` and `HouseExtension.tsx` define `organizationSchema` variables but fail to pass them to the `<Seo />` component's `jsonLd` prop.
*   **Action:** Pass the schema variable to the component.
*   **Correction:** `<Seo ... jsonLd={organizationSchema} />`

---

### Phase 2: Crawlability & Semantics
**Urgency:**  High
**Objective:** Make navigation visible to bots and improve semantic understanding.

#### Task 2.1: Replace `onClick` Navigation with Semantic Links
*   **Description:** The landing page uses buttons with `onClick={() => navigate('/...')}`. Search engine crawlers do not execute click events to find links. They look for `<a href="...">`.
*   **Action:** Refactor `HeroWithSideText`, `TwoColumnSplitLayout`, and `FeatureSection` calls in `Landing.tsx`.
*   **Implementation:**
    *   Change logic to accept `href` props that render real `<a>` (or `react-router-dom` `<Link>`) tags styled as buttons.
    *   Ensure internal links use relative paths.

#### Task 2.2: Implement `Service` & `Product` Schema
*   **Description:** Currently, all pages use generic `Organization` schema. Specific pages should accurately describe the service being offered.
*   **Action:**
    *   **Garden Room:** Define `Product` schema (or `Service`) describing the "Steel Frame Garden Room".
    *   **House Extension:** Define `Service` schema for "House Extension Construction".
    *   **Contact:** Implement `LocalBusiness` schema with opening hours and geo-coordinates.

---

### Phase 3: Content & Performance Tweaks
**Urgency:**  Medium
**Objective:** Improve ranking keywords and user experience signals.

#### Task 3.1: Image Alt Text Audit
*   **Description:** Images in `MasonryGallery` and heroes likely lack descriptive alt text.
*   **Action:**
    *   Review `Landing.tsx` and `Gallery.tsx`.
    *   Ensure all image objects/props include meaningful `alt` text (e.g., "Modern grey steel garden room office").

#### Task 3.2: Meta Description Optimization
*   **Description:** Review existing descriptions in `Landing.tsx` and `About.tsx`. Ensure they are actionable and under 160 characters.
*   **Action:** Rewrite descriptions to include primary keywords ("Steel frame", "Turnkey", "Dublin") and a call to action.

---

### Phase 4: Long-Term Architecture (Post-Launch)
**Urgency:**  Low (Weeks 3-4)
**Objective:** Perfect Core Web Vitals and rendering reliability.

#### Task 4.1: SSG / Pre-rendering Investigation
*   **Description:** To guarantee bots see content without executing JS, we should pre-render public routes.
*   **Action:** Investigate adding `vite-plugin-ssr` or simply using a pre-render script to generate static `.html` files for the fixed set of public routes at build time.

#### Task 4.2: Image Optimization Pipeline
*   **Description:** Current images are large JPEGs/PNGs.
*   **Action:** Implement a build step or CDN to serve WebP/AVIF formats and generate `srcset` for responsive loading.

---

**Plan Approved By:** GitHub Copilot (Senior Web Architect)
**Date:** January 7, 2026
