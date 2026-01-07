# SEO Performance Analysis & Optimization Strategy

## 1. Executive Summary

The current web application (`@modular-house/web`) is a Client-Side Rendered (CSR) Single Page Application (SPA) built with Vite and React. While it leverages a robust UI library and includes a dedicated `Seo` component for `react-helmet-async` integration, the current architecture presents significant challenges for search engine crawlers.

The primary issues are the **lack of Server-Side Rendering (SSR)** or Static Site Generation (SSG), **missing critical SEO files** (sitemap, robots.txt), and **inconsistent metadata implementation** across routes. This document outlines the critical flaws and provides a roadmap for remediation.

## 2. Technical Architecture Analysis

### 2.1. Rendering Strategy (Critical Weakness)
*   **Current State:** The app uses standard Vite CSR. This means the initial HTML payload is an empty root div (`<div id="root"></div>`). Search engines must execute JavaScript to see any content.
*   **Impact:** While Google is capable of rendering JS, it is resource-intensive and often deferred. Other crawlers (social media bots, smaller search engines) may see a blank page. First Contentful Paint (FCP) is delayed until JS execution.
*   **Recommendation:** Migration to a meta-framework with SSR/SSG capabilities (like Next.js or Remix) is the gold standard. Alternatively, for the current Vite setup, **SSG (Static Site Generation)** using `vite-plugin-ssr` or pre-rendering routes is highly recommended to serve fully populated HTML.

### 2.2. Meta Tag Management
*   **Current State:**
    *   Managed via `react-helmet-async`.
    *   A centralized `<Seo />` component exists in `@modular-house/ui`.
    *   `index.html` has no fallback metadata if JS fails.
*   **Issues:**
    *   **`Gallery.tsx`**: The `Seo` component is imported but implemented without props. This results in the default title (or empty) and no description, damaging the ranking for "Gallery" or "Portfolio" keywords.
    *   **`GardenRoom.tsx` & `HouseExtension.tsx`**: These files define an `organizationSchema` constant but **fail to pass it** to the `jsonLd` prop of the `Seo` component. This is dead code and lost opportunity for Rich Snippets.
    *   **Dynamic Routes**: It is unclear how dynamic routes (e.g., individual gallery items if they exist deep-linked) handle metadata.

### 2.3. Crawlability & Indexing (Missing Assets)
*   **`robots.txt`**: **Missing**. Crawlers have no directives on what to scan or ignore (e.g., admin routes).
*   **`sitemap.xml`**: **Missing**. Google has no map of the site structure to discover pages like `/garden-room`, `/house-extension`, or `/gallery`.
*   **Canonical URLs**: Manually hardcoded in each route. This is error-prone (e.g., mismatch between `modularhouse.ie` vs `www.modularhouse.ie` or trailing slashes).

## 3. Component & Content Analysis

### 3.1. Structured Data (JSON-LD)
*   **Landing Page**: Correctly implements `Organization` schema.
*   **Service Pages**: `GardenRoom` and `HouseExtension` define the schema but do not render it.
*   **Missing Schema**:
    *   **Product/Service Schema**: "Garden Room" and "House Extension" should use `Product` or `Service` schema, not just `Organization`.
    *   **LocalBusiness**: Should be used for the Contact page to boost local SEO (Dublin area).
    *   **BreadcrumbList**: Missing for deep navigation.

### 3.2. Semantic HTML & Accessibility
*   **Headings**: Usage of `h1` and `h2` appears consistent in `About` and text-heavy pages.
*   **Images**:
    *   The `MasonryGallery` and `HeroWithSideText` usage in `Landing.tsx` passes image URLs. We need to verify if `alt` text is being strictly passed and rendered.
    *   Missing `alt` text is a significant accessibility and SEO penalty.
*   **Links**: Internal linking relies on `useNavigate` in some `div` clicks (e.g., buttons in `HeroWithSideText`) or standard `<Link>`. `<a>` tags (anchors) are preferred for crawlers to follow links. `onClick` navigation is **invisible** to crawlers.

## 4. Performance Factors
*   **Images**: Images are loaded directly from external sources (Unsplash, theme demos) or `public/` assets without modern format conversion (WebP/AVIF) or responsive sizing (`srcset`). This hurts Core Web Vitals (LCP/CLS).
*   **Scripts**: No evidence of script deferral/async strategies for third-party tools (if any).

## 5. Immediate Remediation Plan (Phase 1)

These changes should be implemented immediately within the current Vite architecture.

1.  **Create `public/robots.txt`**: Allow indexing of all public routes, disallow `/admin`.
2.  **Generate `sitemap.xml`**: Use a Vite plugin (e.g., `vite-plugin-sitemap`) to auto-generate this at build time.
3.  **Fix `Gallery.tsx` Metadata**: Populate `<Seo />` props with relevant keywords and description.
4.  **Fix JSON-LD Injection**: Connect the unused `organizationSchema` in service pages and upgrade it to `Service` schema.
5.  **Audit `onClick` Navigation**: Replace `onClick={() => navigate('/...')}` with proper `<Link to="...">` or `<a href="...">` wrappers to ensure crawlers can follow the site structure.

## 6. Long-Term Strategy (Phase 2)

6.  **Static Site Generation (SSG)**: Configure Vite to pre-render the known public routes (`/`, `/about`, `/contact`, `/gallery`, etc.) into static HTML files.
7.  **Image Optimization**: Implement an image handling pipeline to convert assets to WebP and generate srcsets.
8.  **Strict Semantic Audit**: Ensure all interactive elements are keyboard accessible and images have descriptive alt text.

---

**Analyst:** Gemini 3 Pro (Senior Web Architect)
**Date:** January 7, 2026
