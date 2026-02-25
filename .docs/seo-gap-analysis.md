# SEO Gap Analysis: modularhouse.ie vs homemodular.ie (#1 on Google for "Home Modular")

**Date:** 2026-02-25  
**Author:** Senior Web Architect  
**Scope:** Fundamental SEO comparison between our React SPA/SSG web app and the #1 ranked competitor (homemodular.ie, WordPress + Yoast SEO + Elementor)

---

## Executive Summary

Our web app has solid **engineering-level SEO foundations** (SSG pre-rendering, structured data types, sitemap generation, robots.txt) but is **critically missing several on-page SEO signals** that the #1 competitor has. The gaps are not in our architecture—they're in what we're actually rendering into the HTML that Google crawls. Most of these are **quick wins** that the team already has tooling for but hasn't wired up.

**Severity Rating:**  
- 🔴 Critical — directly impacts ranking/indexing  
- 🟡 Important — affects SERP appearance and CTR  
- 🟢 Nice-to-have — marginal improvement  

---

## 1. 🔴 Missing Open Graph & Twitter Card Meta Tags

**Competitor (homemodular.ie):**
```html
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta property="og:title" content="Modular Homes Ireland | Turnkey Homes | Home Modular">
<meta property="og:description" content="Modular Homes, delivered turnkey...">
<meta property="og:url" content="https://homemodular.ie/">
<meta property="og:site_name" content="Home Modular">
<meta property="og:image" content="...1024x683.png">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="683">
<meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image">
```

**Our app:**  
The `SEOHead` component in `apps/web/src/components/seo/SEOHead.tsx` only renders `<title>` and `<meta name="description">`. There is a comment that says *"Open Graph / Twitter Card tags could be added here in the future"* — but it was never done.

**Irony:** The UI library already ships a full `Seo` component (`packages/ui/src/components/Seo/Seo.tsx`) with complete OG and Twitter Card support. The `Landing.tsx` page even *uses* this component with full OG/Twitter props — but the `TemplateLayout` wraps every route with the simpler `SEOHead` instead.

**Impact:** Without OG tags, Google cannot properly associate images and rich previews with our pages. Social sharing on Facebook, LinkedIn, and Twitter shows generic/broken previews. Google uses `og:image` as a ranking signal for image-heavy queries.

**Fix:** Either:
- (A) Replace `SEOHead` with the UI library's `Seo` component across the board, or
- (B) Extend `SEOConfig` type and `SEOHead` to pass through OG + Twitter data, and populate it in `routes-metadata.ts`

---

## 2. 🔴 Missing Canonical URL Tags

**Competitor:**
```html
<link rel="canonical" href="https://homemodular.ie/">
```
Every page has a self-referencing canonical. This is **critical** to prevent duplicate content issues (e.g. `/garden-room` vs `/garden-room/` vs query-string variants).

**Our app:**  
No `<link rel="canonical">` is rendered anywhere by `SEOHead`. The `Seo` component in the UI library supports it (`canonicalUrl` prop) and Landing.tsx even passes one — but `TemplateLayout` doesn't use the `Seo` component.

**Impact:** Google may split ranking signals across URL variants, weakening our page authority.

**Fix:** Add canonical URLs to `SEOConfig` and render them in `SEOHead`. Every page should have a self-referencing canonical.

---

## 3. 🔴 Missing Robots Meta Directive

**Competitor:**
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
```
This tells Google: *"Index this page, follow all links, show large image previews, and don't limit snippet length."*

**Our app:**  
No `<meta name="robots">` tag is rendered. While Google defaults to `index, follow`, the **missing `max-image-preview:large`** is significant — it enables large image thumbnails in search results, which dramatically increases click-through rate.

**Fix:** Add a default robots meta (`index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`) to the SEOHead component. Allow override per-route for pages like `/admin/*`.

---

## 4. 🔴 No Blog / Content Marketing Strategy

**Competitor:**  
WordPress site with an established content management system. Blog/article capability is built-in. Content marketing is the #1 off-page SEO strategy — Google rewards sites that regularly publish relevant, keyword-rich content.

**Our app:**  
Pure static pages. No blog, no articles, no news section. There is no CMS capability for content publishing.

**Impact:** This is arguably the biggest structural gap. The competitor can publish articles targeting long-tail keywords like *"modular homes planning permission Ireland"*, *"how long does it take to install a modular home"*, etc. Each article is a new URL for Google to index and a new opportunity to rank.

**Fix (medium-term):** Either:
- Integrate a headless CMS (Contentful, Sanity, Strapi) and add a `/blog` route
- Or at minimum, add static informational pages targeting high-value keyword clusters

---

## 5. 🟡 Incomplete Structured Data (JSON-LD)

**Competitor (Yoast SEO generates this automatically):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "url": "...", "name": "...", "datePublished": "...", "dateModified": "...", "breadcrumb": {...} },
    { "@type": "ImageObject", "url": "...", "width": 1536, "height": 1024 },
    { "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home"}] },
    { "@type": "WebSite", "url": "...", "name": "...", "potentialAction": [{"@type": "SearchAction", "target": "...?s={search_term_string}"}] },
    { "@type": "Organization", "name": "...", "logo": {...}, "sameAs": ["instagram", "tiktok"] }
  ]
}
```

**Our app has:**
- `Organization` schema on landing page
- `Product` schema with pricing on garden-room and house-extension pages
- `LocalBusiness` schema on contact page

**Our app is missing:**
| Schema Type | Why It Matters |
|---|---|
| `WebPage` with `datePublished`/`dateModified` | Freshness signals for Google |
| `BreadcrumbList` | Rich breadcrumb display in SERP results |
| `WebSite` with `SearchAction` | Sitelinks search box in Google |
| `FAQPage` | Rich FAQ snippets — competitor has 8 FAQs in accordion format |
| `AggregateRating` / `Review` | Star ratings in SERP — competitor shows "252 reviews, 5/5" with schema markup |
| `ImageObject` (primaryImageOfPage) | Ensures Google associates the right image with the page |

**Fix:** Extend `routes-metadata.ts` to include `BreadcrumbList` and `WebPage` schemas. Add `FAQPage` schema to the landing page (the FAQ content already exists in the `MiniFAQs` component). Add `AggregateRating` to Product schemas once reviews are available.

---

## 6. 🟡 No `<lastmod>` in Sitemap

**Competitor:** WordPress auto-generates `<lastmod>` dates in `sitemap.xml`.

**Our app:** `sitemap-generator.ts` generates `<loc>`, `<changefreq>`, and `<priority>` but **no `<lastmod>`**.

**Impact:** Google uses `<lastmod>` to decide recrawl priority. Without it, Google must guess when pages changed.

**Fix:** Inject the build timestamp as `<lastmod>` for all pages. In `sitemap-generator.ts`, add `new Date().toISOString()` as the `<lastmod>` value.

---

## 7. 🟡 Google Reviews / Social Proof Schema

**Competitor:**
```html
<span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
  <span itemprop="ratingValue">5</span>
  <span itemprop="bestRating">5</span>
  <span itemprop="worstRating">1</span>
</span>
```
They embed a live Google Reviews widget (252 reviews, 5.0 rating) with proper schema markup. This gives them **star ratings in Google search results**.

**Our app:**  
Has a `TestimonialGrid` component with hardcoded fake testimonials (names like "Emily Chen", "Carlos Rivera" — placeholder data from a template). No schema markup on these.

**Impact:** Star ratings in SERP dramatically increase CTR. Real customer reviews are also a trust signal for Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) evaluation.

**Fix:**
1. Replace placeholder testimonials with real customer reviews
2. Integrate a Google Reviews API widget or embed
3. Add `AggregateRating` schema to the Organization structured data

---

## 8. 🟡 Missing RSS/Atom Feeds & oEmbed Links

**Competitor:**
```html
<link rel="alternate" type="application/rss+xml" title="Home Modular » Feed" href=".../feed/">
<link rel="alternate" type="application/rss+xml" title="Home Modular » Comments Feed" href=".../comments/feed/">
<link rel="alternate" title="oEmbed (JSON)" type="application/json+oembed" href="...">
```

**Our app:** None.

**Impact:** RSS feeds allow content aggregators and news readers to discover and reference your content. oEmbed enables rich embedding when your URLs are shared. Both generate backlinks and exposure.

**Fix (low priority):** Consider adding an RSS feed if a blog/content strategy is implemented.

---

## 9. 🟡 Missing `<article:modified_time>` Meta Tag

**Competitor:**
```html
<meta property="article:modified_time" content="2026-02-20T13:02:43+00:00">
```

**Our app:** No modification timestamps anywhere.

**Impact:** Google uses this for freshness evaluation. Pages that appear recently modified may get a ranking boost for time-sensitive queries.

**Fix:** Inject the build timestamp as `article:modified_time` OG meta tag during the SSG pre-render step.

---

## 10. 🟡 Title Tag Strategy

**Competitor:**
```html
<title>Modular Homes Ireland | Turnkey Homes | Home Modular</title>
```
Three keyword phrases, brand name last. Targets multiple keyword variations in one title.

**Our app (landing page):**
```
Modular House Extensions & Garden Rooms | Modular House
```
Also has the `routes-metadata.ts` title, but each page title set via `SEOHead` may be *overridden* by the Landing.tsx component using the `Seo` component directly (title: "Steel Frame Garden Rooms & House Extensions"). **There's a conflict** — two components may be trying to set `<title>` simultaneously.

**Fix:** Audit and consolidate title tag rendering. Ensure only ONE component sets the title per page. Optimize titles for target keywords with brand name suffix.

---

## 11. 🟢 Heading Hierarchy

**Competitor:** Uses a single `<h2>` as the main above-the-fold heading (their theme doesn't correctly use `<h1>`), then cascades through `<h2>`, `<h5>`, `<h6>` for section headers.

**Our app:** Need to verify each page has exactly one `<h1>` and proper heading hierarchy. The UI components (`HeroWithSideText`, `FeatureSection`, etc.) should be audited to ensure they render semantic headings.

**Fix:** Audit heading tags across all UI library components for proper hierarchy.

---

## 12. 🟢 Performance & Resource Hints

**Competitor:**
```html
<link rel="dns-prefetch" href="//www.googletagmanager.com">
<link rel="dns-prefetch" href="//stats.wp.com">
<script type="speculationrules">{"prefetch":[...]}</script><!--modern prefetching-->
```

**Our app:** No `dns-prefetch`, `preconnect`, or speculation rules.

**Fix:** Add `<link rel="preconnect">` for analytics domains and CDNs. Consider speculation rules for internal navigation.

---

## 13. 🟢 Multiple Tracking Pixels (Signal of Established Marketing)

**Competitor has:** Google Tag Manager, Google Analytics (Site Kit), Facebook/Meta Pixel, TikTok Pixel, CookieYes consent management, Jetpack Stats, WhatsApp Click-to-Chat.

**Our app has:** Only Google Analytics (via `GoogleTag` component).

**Impact:** While tracking pixels don't directly affect SEO, they indicate an active marketing operation driving traffic. Google indirectly rewards sites with higher traffic and engagement metrics.

---

## Summary: Priority Fix Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Wire up OG + Twitter Card meta tags | Low — tooling exists | High |
| 🔴 P0 | Add canonical URLs to all pages | Low | High |
| 🔴 P0 | Add robots meta with max-image-preview | Low | Medium-High |
| 🔴 P0 | Resolve dual title-tag conflict (SEOHead vs Seo component) | Low | Medium |
| 🟡 P1 | Add BreadcrumbList schema to all pages | Low | Medium |
| 🟡 P1 | Add FAQPage schema to landing page | Low | Medium |
| 🟡 P1 | Add `<lastmod>` to sitemap | Low | Medium |
| 🟡 P1 | Replace fake testimonials with real reviews + schema | Medium | High |
| 🟡 P1 | Add `article:modified_time` meta tag | Low | Low-Medium |
| 🟡 P2 | Add `WebPage` and `WebSite` schemas | Low | Medium |
| 🔴 P2 | Content strategy / blog capability | High | Very High (long-term) |
| 🟢 P3 | Resource hints (preconnect, dns-prefetch) | Low | Low |
| 🟢 P3 | Heading hierarchy audit | Low | Low |

---

## Architectural Recommendation

The fastest path to fixing the P0 items:

1. **Extend `SEOConfig` type** in `apps/web/src/types/seo.ts` to add `canonicalUrl`, `robots`, `openGraph`, and `twitter` fields
2. **Update `SEOHead`** to render these new fields (or switch entirely to the UI library's `Seo` component)
3. **Populate the new fields** in `routes-metadata.ts` for every route
4. **Remove the duplicate `<Seo>` call** in `Landing.tsx` — let `TemplateLayout` handle all SEO tags via the centralized config
5. **Re-run the SSG build** and verify the pre-rendered HTML contains all expected meta tags

These changes touch ~5 files and can be completed in a single sprint. The blog/content strategy is a separate initiative requiring product and design input.

---

## Conclusion

Our app is **not** fundamentally broken for SEO. The SSG pre-rendering pipeline is solid and gives us a strong indexability foundation. The problem is that the junior team built the plumbing but **never turned on the faucets** — the meta tag infrastructure exists in the UI library but isn't connected to what actually renders. The competitor, powered by WordPress + Yoast SEO, gets all of these tags injected automatically. We need to be intentional about matching that output, tag by tag.
