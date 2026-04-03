# Garden Room SEO Implementation Plan

> **Compiled**: April 2026
> **Baseline**: Scraped `modularhouse.ie/garden-room` compared against top 11 Google results for "garden room" (Dublin, Ireland) from [google-serp-trend-analysis.md](google-serp-trend-analysis.md).

---

## Part A — Gap Analysis: Modular House vs Top 11 Competitors

### What Modular House Already Does Well

| SERP Trend | Modular House Status | Verdict |
|-----------|---------------------|---------|
| `.ie` domain | `modularhouse.ie` ✅ | Matches 10/11 top results |
| Title = keyword + location + USP + brand | "Garden Rooms Ireland \| Steel Frame from 15m² to 45m²" ✅ | Strong — keyword-first, location, USP, size range |
| Meta description ≤160 chars with trust signals | 155 chars, includes sizes, planning exemption, Dublin, free quote ✅ | Optimal |
| H1 contains "Garden Room(s)" | "Steel Frame Garden Rooms" ✅ | Present, but missing location qualifier |
| Product range with sizing & pricing | 4 sizes (15/25/35/45 m²) with "from" pricing ✅ | Best-in-class — size-based, transparent pricing |
| Named product lines | Compact / Studio / Living / Grand ✅ | Strong differentiation |
| Use-case lists per product | Listed on product cards ✅ | Present but surface-level |
| Construction comparison section | 8-category LGS vs Timber vs Brick ✅ | Unique — no competitor has this |
| FAQ section | 6 FAQs with accordion ✅ | Present |
| FAQPage schema | ✅ Implemented | First-mover advantage over all 11 competitors |
| Product schema with pricing | ✅ 4 offers with availability | First-mover advantage over all 11 competitors |
| BreadcrumbList schema | ✅ Auto-generated | Present |
| OG + Twitter Card | ✅ Full implementation | Comprehensive |
| Canonical URL | ✅ Set | Present |
| Testimonials with star ratings | 3 testimonials with names + locations ✅ | Good but limited volume |
| "Bespoke" option | "Go Bespoke" banner with enquiry form ✅ | Strong positioning |
| Transparent pricing | ✅ "Turnkey price from €29,500" etc. | Matches Shomera approach; better than 7/11 competitors |
| Dublin factory mention | ✅ "Made in Our Dublin Factory" section | Strong local signal |
| Image alt tags | ✅ Descriptive alt text on all images | Well-optimised |

### Critical Gaps vs Top 11

| Gap | Impact | What Top Competitors Do | Modular House Current State |
|-----|--------|------------------------|---------------------------|
| **URL path is `/garden-room` (singular)** | High | 7/11 competitors use `/garden-rooms/` (plural). No redirect from plural to singular exists. Users and Google may search for the plural form. | Only `/garden-room` exists. No `/garden-rooms` redirect. |
| **H1 missing geographic qualifier** | High | 9/11 top results include "Ireland" or "Dublin" in H1. E.g., "Garden Rooms Ireland", "Garden Rooms Dublin". | H1 is "Steel Frame Garden Rooms" — no location. |
| **No blog / informational content** | High | Competitors rank for long-tail informational queries (planning permission, cost guides, ideas). 6/11 have blog sections. | No blog section exists. Zero informational pages. |
| **No dedicated use-case pages** | Medium | Shomera, MCD, Shanette list extensive use cases. No competitor has *individual* use-case pages either — but the trend shows detailed use-case content wins. | Use cases are tags on product cards only. No standalone content. |
| **No "/garden-rooms" plural redirect** | Medium | Google indexes both singular/plural. Users may type either form. | 404 on `/garden-rooms`. Potential lost traffic. |
| **No step-by-step process section** | Medium | 8/11 competitors show a "How It Works" process (typically 3 steps: Enquire → Design → Build). MCD does "Order → Build → Create". | No process section. Timeline only described within FAQ answer #2. |
| **No Google Reviews / Trustpilot widget** | Medium | 7/11 competitors display third-party review widgets (Google Reviews badge, Trustpilot seal). MCD: 4.8/5 from 197 reviews. SummerHouse24: 4.71/5 from 334. | Custom testimonials only (3 quotes, not independently verifiable). |
| **No Google Map embed** | Low–Med | 7/11 competitors mention showrooms with maps. Google's local ranking factors reward verifiable physical locations. | Address in footer + LocalBusiness schema, but no visual map. |
| **No video content** | Low–Med | Only Shomera uses video. However, SERP analysis shows Google rewards video content as a ranking factor and SERP feature. | No video integrations. |
| **Warranty inconsistency** | Medium | Competitors clearly state warranties: Shomera "10-year structural + 20-year roof", MCD "10-year guarantee". | Contradictory: 50-year (homepage), 25-year (data file), 10-year (FAQ). Confusing to users and Google. |
| **AggregateRating schema missing** | Low–Med | No competitor has this either, but adding it would amplify rich snippet visibility. | Not present. |
| **Long-form authority content thin** | Medium | Shomera has ~4,000+ words. gardenrooms.ie has lengthy "What Makes a Great Garden Room" copy. MCD has extensive material descriptions. | ~2,300 words total. Adequate, but thinner than top 3 competitors. |
| **LocalBusiness/Organization schema not on page** | Low | Some competitors include it. Modular House has it site-wide but not garden-room page-specific. | Present globally, not page-specific. Acceptable. |

---

## Part B — Implementation Plan

### Priority System
- **P0 — Critical**: Directly impacts ranking for target keyword. Do first.
- **P1 — High**: Strong SEO or conversion impact. Do within same sprint.
- **P2 — Medium**: Content and feature additions that build topical authority over time.
- **P3 — Low**: Nice-to-have improvements. Schedule when bandwidth allows.

---

### PHASE 1: Quick Technical Fixes (P0)

> **Goal**: Fix technical SEO issues that could immediately affect crawling, indexation, and ranking signals.

#### Task 1.1 — Set `/garden-rooms` as Canonical Path & Redirect Singular to Plural

**File**: `apps/web/src/App.tsx` (or route config), `apps/web/src/route-config.tsx`, `apps/web/src/routes-metadata.ts`
**What to do**:
1. Change the garden room route path from `/garden-room` (singular) to `/garden-rooms` (plural) in `route-config.tsx`.
2. Add a `<Navigate>` redirect from `/garden-room` (singular) to `/garden-rooms` (plural) with `replace` flag:
   ```tsx
   <Route path="/garden-room" element={<Navigate to="/garden-rooms" replace />} />
   ```
3. Update the canonical URL in `routes-metadata.ts` from `https://modularhouse.ie/garden-room` to `https://modularhouse.ie/garden-rooms`.
4. Update all internal links, OG URLs, schema URLs, and sitemap entries to use `/garden-rooms`.
5. Update configurator sub-routes (e.g., `/garden-room/configure/*` → `/garden-rooms/configure/*`).

**Why**: 7/11 top competitors use `/garden-rooms/` (plural). Aligning with the dominant convention matches how users and Google expect the path. The singular redirect preserves any existing link equity.
**Acceptance criteria**: `modularhouse.ie/garden-rooms` loads the garden room page. `modularhouse.ie/garden-room` returns HTTP 301 and redirects to `modularhouse.ie/garden-rooms`. All internal links point to the plural path.

---

#### Task 1.2 — Add Location Qualifier to H1

**File**: `apps/web/src/routes/GardenRoom.tsx` (line ~204)
**What to do**: Change the H1 hero text from:
- Current: `"Steel Frame Garden Rooms"` + `"Built to Last. Designed for Living."`
- New: `"Dublin Manufactured Steel Frame Garden Rooms"` + `"Built to Last. Designed for Living."`

Alternatively, if "Dublin" in the H1 looks awkward visually, use a variant such as:
- `"Steel Frame Garden Rooms Ireland"` (matches 5/11 top titles using "Ireland")
- Or restructure: `"Garden Rooms Dublin"` as H1, with `"Steel Frame. Built to Last."` as the subtitle/tagline.

**Why**: 9/11 top results include "Ireland" or "Dublin" in their H1. Google uses H1 as a primary relevance signal for local queries. The current H1 lacks any geographic term.
**Acceptance criteria**: The H1 tag rendered in the DOM contains either "Dublin" or "Ireland" alongside "Garden Room(s)".

---

#### Task 1.3 — Fix Warranty Inconsistency

**Files**: Three locations need to be aligned:
1. `apps/web/src/routes-metadata.ts` (~L186–192) — homepage schema says "50-year structural warranty"
2. `apps/web/src/data/garden-room-data.ts` (~L206–215) — data file says "25-year Structural Warranty"
3. `apps/web/src/data/garden-room-data.ts` (~L373–423) — FAQ answer says "10-year structural warranty"

**What to do**: Set all warranty mention to "25-year Structural Warranty"
**Why**: Contradictory warranty information undermines trustworthiness (Google E-E-A-T) and is confusing for users. Competitors clearly state consistent timeframes (Shomera: 10-year structural + 20-year roof; MCD: 10-year guarantee).
**Acceptance criteria**: A single, consistent warranty figure appears across the entire website. Grep search for the old values returns zero results.

---

### PHASE 2: On-Page Content Enhancements (P1)

> **Goal**: Add missing content sections that top-ranking competitors consistently include.

> Tasks 2.1, 2.2, 2.3, 2.4 archived, do not implement — see [archived-tasks.md](./archived-tasks.md)

---

### PHASE 3: Content Gap Filling (P2)

> **Goal**: Create supporting content that builds topical authority and captures long-tail keyword traffic.

> Tasks 3.1, 3.2, 3.3 archived, do not implement  — see [archived-tasks.md](./archived-tasks.md)

---

#### Task 3.4 — Update Sitemap for `/garden-rooms` Canonical Path

**File**: `apps/web/src/routes-metadata.ts` (sitemap config)
**What to do**: After Task 1.1 is complete, update the sitemap entry from `/garden-room` to `/garden-rooms` (plural). Ensure:
1. `/garden-rooms` is listed as the canonical sitemap entry with priority 0.9.
2. `/garden-room` (singular) is **not** in the sitemap (it's a redirect, not a canonical page).
3. Configurator sub-routes under `/garden-rooms/configure/*` are also updated if present in sitemap.

**Why**: Sitemap entries must match canonical URLs. After the path change in Task 1.1, the sitemap must reflect `/garden-rooms` as the primary URL.
**Acceptance criteria**: XML sitemap at `modularhouse.ie/sitemap.xml` lists `/garden-rooms` (not `/garden-room`). No redirect URLs appear in the sitemap.

---

### PHASE 4: Trust & Conversion Optimisation (P2)

> **Goal**: Strengthen trust signals to match or exceed competitor benchmarks.

> Tasks 4.1, 4.2, 4.3, 4.4 archived, do not implement  — see [archived-tasks.md](./archived-tasks.md)

---

### PHASE 5: Advanced SEO & Monitoring (P3)

> **Goal**: Long-term SEO improvements and tracking.

> Tasks 5.1, 5.2, 5.3 archived, do not implement  — see [archived-tasks.md](./archived-tasks.md)

---

## Execution Summary

### Active Tasks (This Sprint)

| Task | Description | Priority | Effort |
|------|------------|----------|--------|
| **1.1** | Set `/garden-rooms` as canonical path, redirect singular → plural | P0 | Small |
| **1.2** | Add location qualifier ("Dublin" or "Ireland") to H1 | P0 | Small |
| **1.3** | Fix warranty inconsistency (align to 25-year across site) | P0 | Small |
| **3.4** | Update sitemap entry from `/garden-room` to `/garden-rooms` | P0 | Small |

**Execution order**: 1.1 → 3.4 → 1.2 → 1.3

Task 1.1 and 3.4 are coupled (path change + sitemap update). Task 1.2 and 1.3 are independent and can be done in any order after.

### Archived / Completed / Removed

> 11 archived, 1 completed, 2 removed — see [archived-tasks.md](./archived-tasks.md) for full details.
