/**
 * build-timestamp.ts
 *
 * Single authoritative build timestamp for the entire SSG pipeline.
 *
 * Captured once at module initialization time so that all artifacts produced
 * during a single build run — sitemap <lastmod>, WebPage.dateModified,
 * WebPage.datePublished, and og:article:modified_time — carry an identical
 * value regardless of which module evaluates first.
 *
 * This module exists as a separate file (rather than being declared in
 * prerender.ts) so that both execution contexts can import it without
 * creating a cross-boundary dependency:
 * - Browser/SSR bundle: src/routes-metadata.ts imports this file directly.
 * - Node.js scripts: scripts/prerender.ts and scripts/sitemap-generator.ts
 *   import this file via a relative path.
 *
 * The single-source guarantee is structural: any module that needs a
 * freshness signal must import BUILD_TIMESTAMP from this file rather than
 * constructing its own Date value.
 *
 * Format: ISO 8601 UTC string (e.g. "2026-02-27T10:00:00.000Z").
 */
export const BUILD_TIMESTAMP = new Date().toISOString();
