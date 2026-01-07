# Component Architecture & Implementation Analysis

## 1. Executive Summary

A detailed audit of the core UI components (`Header`, `HeroWithSideText`, `TwoColumnSplitLayout`, `FeatureSection`, `MasonryGallery`) reveals a mixed implementation state. While the current architecture for navigation (using `<a>` tags with `preventDefault` handlers) is theoretically **SEO-compliant**, it relies on a fragile and verbose implementation pattern. Additionally, there are significant accessibility gaps in image handling and inconsistent prop interfaces.

The primary recommendation is to refactor these components to fully leverage the existing 'Open-Closed' design philosophy by introducing true polymorphic capabilities (using `as={Link}`) rather than manual event handling, and to strictly enforce accessibility props.

## 2. Component-Level Analysis

### 2.1. Navigation & Linking Strategy
*   **Current State:**
    *   Components like `HeroWithSideText` and `TwoColumnSplitLayout` accept a `xyzLink` (string) and an `onXyzClick` (handler).
    *   They render an `<a href="...">` and attach an `onClick` that calls preventing default behavior.
    *   **Pros:** It generates valid semantic HTML (`<a href>`), so crawlers **can** see the links. This corrects a potential misunderstanding in the initial SEO report.
    *   **Cons:**
        *   **Verbose:** Developer must pass *both* the URL and the `navigate()` handler.
        *   **Fragile:** Forgetting the `href` breaks SEO. Forgetting the handler causes a full page reload (performance hit).
        *   **Redundant:** React Router's `<Link>` component already handles this standard behavior perfectly.
*   **Recommendation:** Refactor buttons/links to support a "polymorphic" approach or simple `ReactNode` replacement.
    *   *Option A (Polymorphic):* Allow passing a component "as" prop (e.g., `<Button as={Link} to="/contact" />`).
    *   *Option B (Composition):* Accept a `linkComponent` prop or slots.

### 2.2. `MasonryGallery` (Critical SEO/A11y Gap)
*   **Current State:**
    *   The component *definition* supports an `alt` property in the `GalleryImage` interface.
    *   **Issue:** In `Landing.tsx`, the component is instantiated with an array of images that **omit the `alt` property**.
*   **Impact:** Accessibility violation and SEO penalty. Screen readers read filenames or nothing.
*   **Recommendation:**
    *   Make `alt` a **required** property in the `GalleryImage` interface to enforce compliance at the type-checking level.

### 2.3. `FeatureSection` (Semantics)
*   **Current State:**
    *   Renders features in a `<div>` with `onClick` handlers.
    *   The items are interactive (click handlers, keyboard events), but they are not semantic links (`<a>`).
*   **Impact:**
    *   Search engines treat this as static text. If these features are intended to link to service pages (e.g., "Precision Steel Framing" -> `/technology`), they are invisible to generic crawlers.
    *   Semantic structure (`h6` -> `h1` -> `h5`) is generally good.
*   **Recommendation:**
    *   Add an optional `href` property to `FeatureItem`.
    *   If `href` is present, render the wrapper as an `<a>` tag (or `<Link>`), maintaining the card layout.

### 2.4. `Header` (Navigation)
*   **Current State:**
    *   Uses standard `<a>` tags (implied based on `MenuItem` interface having `href`).
    *   Needs verification if it uses the same "manual preventDefault" pattern.
    *   State management involves internal vs controlled mixed logic, which adds complexity but offers flexibility.
*   **Risk:** If `Header` renders plain `<a>` tags without client-side interception (when no explicit handler is passed), every menu click triggers a full browser refresh, negating the SPA benefits. (Further verification of `Header` render logic needed).

## 3. General Architecture Observations

### 3.1. Accessibility (A11y)
*   **Alt Text:** Inconsistently applied.
*   **Keyboard Navigation:** `FeatureSection` manually implements `onKeyDown` for Enter/Space, which is good attention to detail.
*   **Headings:** Good hierarchy (`h1` for main titles, `h5`/`h6` for subtitles/features).

### 3.2. Performance (Images)
*   **Current State:** Components accept raw string URLs (`src`).
*   **Deficiency:** There is no built-in support for `srcset`, `sizes`, or next-gen formats within the UI library itself. It relies entirely on the consumer to provide the correct URL.
*   **Recommendation:** Create a wrapper `<Image />` component in the UI package that automatically generates `srcset` or accepts a responsive image object, ensuring LCP optimization.

## 4. Prioritized Architecture Action Items

1.  **Refactor Link Handling (High Impact):**
    *   Update `HeroWithSideText`, `TwoColumnSplitLayout`, and `Header` to accept a custom Link component (e.g. `component={Link}`) or simply standardized on `react-router-dom` since it is already a peer dependency.
    *   Stop manual `preventDefault` handling where possible.

2.  **Enforce Alt Text (Quick Win):**
    *   Update `GalleryImage` interface: `alt: string` (remove optional `?`).
    *   Update all usages in specific routes to satisfy the type.

3.  **Semantic Feature Links:**
    *   Update `FeatureSection` to support linking feature items to dedicated pages semantically.

---

**Analyst:** GitHub Copilot (Senior Web Architect)
**Date:** January 7, 2026
