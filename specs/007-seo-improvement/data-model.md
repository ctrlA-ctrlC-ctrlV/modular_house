# Data Model: SEO Implementation Improvement

**Branch**: `007-seo-improvement` | **Date**: 2026-02-25

---

## Overview

This feature does not introduce a new database or persistent data store. The "data model" for this feature is the **type system** that governs how SEO configuration flows from `routes-metadata.ts` → `TemplateLayout` → rendered HTML `<head>`. The key change is extending `SEOConfig` to carry the full set of meta tag data.

---

## 1. Extended `SEOConfig` Interface

**File**: `apps/web/src/types/seo.ts`

```
SEOConfig
├── title: string                        (existing — required)
├── description: string                  (existing — required)
├── canonicalUrl?: string                (NEW — absolute URL for <link rel="canonical">)
├── robots?: string                      (NEW — crawler directive, default applied in layout)
├── openGraph?: OpenGraph                (NEW — social sharing meta tags)
│   ├── type?: 'website' | 'article' | ...
│   ├── title?: string
│   ├── description?: string
│   ├── image?: string                   (absolute URL to OG image)
│   ├── imageWidth?: number              (NEW — width in pixels, e.g. 1200)
│   ├── imageHeight?: number             (NEW — height in pixels, e.g. 630)
│   ├── imageType?: string               (NEW — MIME type, e.g. 'image/png')
│   ├── url?: string
│   └── siteName?: string
├── twitter?: TwitterCard                (NEW — Twitter Card meta tags)
│   ├── cardType?: 'summary' | 'summary_large_image' | ...
│   ├── site?: string
│   ├── title?: string
│   ├── description?: string
│   ├── image?: string
│   └── imageAlt?: string
└── schema?: SchemaDef[]                 (existing — JSON-LD structured data)
    └── SchemaDef
        ├── type: string                 (schema.org @type, e.g. 'Organization')
        └── data: Record<string, unknown>
```

**Notes**:
- `OpenGraph` and `TwitterCard` types are re-exported from `packages/ui/src/components/Seo/Seo.tsx` to avoid type duplication. `apps/web/src/types/seo.ts` imports them.
- `imageWidth`, `imageHeight`, `imageType` are extensions beyond the current `OpenGraph` type in the UI package — these fields need to be added to `packages/ui/src/components/Seo/Seo.tsx` and the `Seo` component rendering logic updated to emit `og:image:width`, `og:image:height`, `og:image:type` tags.
- All new fields are optional — backward compatibility with existing routes is preserved.

---

## 2. Extended `SitemapConfig` Interface

**File**: `apps/web/src/types/seo.ts`

```
SitemapConfig
├── changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
├── priority?: number
└── lastmod?: string                     (NEW — ISO 8601 date string, injected at build time)
```

**Note**: `lastmod` is marked as optional because it is computed at build time (not statically authored). The sitemap generator reads this field if present; otherwise it injects the build timestamp as a fallback for all routes.

---

## 3. Schema Generator Utility — Output Types

**File**: `apps/web/src/utils/schema-generators.ts` (NEW)

### `generatePageSchema` — Output Shape

```
SchemaDef[] (2 items)
│
├── [0] WebPage Schema
│    ├── type: 'WebPage'
│    └── data:
│         ├── @id: string              (e.g. "https://modularhouse.ie/garden-room#webpage")
│         ├── url: string              (e.g. "https://modularhouse.ie/garden-room")
│         ├── name: string             (page title)
│         ├── description: string      (page description)
│         ├── datePublished: string    (ISO 8601, build timestamp)
│         ├── dateModified: string     (ISO 8601, build timestamp)
│         └── breadcrumb:
│              └── @id: string         (e.g. "https://modularhouse.ie/garden-room#breadcrumb")
│
└── [1] BreadcrumbList Schema
     ├── type: 'BreadcrumbList'
     └── data:
          ├── @id: string              (e.g. "https://modularhouse.ie/garden-room#breadcrumb")
          └── itemListElement: ListItem[]
               ├── [0]: { @type: 'ListItem', position: 1, name: 'Home', item: 'https://modularhouse.ie' }
               └── [1]: { @type: 'ListItem', position: 2, name: string }  (omitted for homepage)
```

**Homepage (`/`) variant**: `itemListElement` contains only position 1 ("Home") with no `item` field.

### `generateWebSiteSchema` — Output Shape

```
SchemaDef (1 item)
├── type: 'WebSite'
└── data:
     ├── @id: string                   (e.g. "https://modularhouse.ie/#website")
     ├── url: string                   (e.g. "https://modularhouse.ie/")
     ├── name: string                  ("Modular House")
     ├── description: string
     └── potentialAction: SearchAction[]
          └── [0]:
               ├── @type: 'SearchAction'
               ├── target:
               │    ├── @type: 'EntryPoint'
               │    └── urlTemplate: 'https://modularhouse.ie/?s={search_term_string}'
               └── query-input:
                    ├── @type: 'PropertyValueSpecification'
                    ├── valueRequired: true
                    └── valueName: 'search_term_string'
```

---

## 4. FAQPage Schema — Output Shape

**Defined in**: `apps/web/src/routes-metadata.ts` (homepage entry, `schema` array)

```
SchemaDef (1 item)
├── type: 'FAQPage'
└── data:
     └── mainEntity: Question[]
          ├── [0]:
          │    ├── @type: 'Question'
          │    ├── name: 'Why choose Steel Frame over timber or block?'
          │    └── acceptedAnswer:
          │         ├── @type: 'Answer'
          │         └── text: '...' (matches MiniFAQs FAQ item 01 description)
          ├── [1]:
          │    ├── @type: 'Question'
          │    ├── name: 'Do I need planning permission?'
          │    └── acceptedAnswer:
          │         └── text: '...' (matches MiniFAQs FAQ item 02 description)
          └── [2]:
               ├── @type: 'Question'
               ├── name: 'Is my build guaranteed?'
               └── acceptedAnswer:
                    └── text: '...' (matches MiniFAQs FAQ item 03 description)
```

**Constraint**: Question `name` and `acceptedAnswer.text` values MUST be verbatim copies of what `MiniFAQs` renders to the DOM. Any future content changes to `MiniFAQs` FAQs require updating the schema in `routes-metadata.ts` simultaneously.

---

## 5. Route Metadata — Target State (Per Route)

After this feature, each public route in `routes-metadata.ts` will carry:

| Route | canonicalUrl | openGraph.image | twitter | BreadcrumbList | WebPage | FAQPage | WebSite |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | ✅ | landing_hero.png | ✅ | ✅ (Home only) | ✅ | ✅ | ✅ |
| `/garden-room` | ✅ | garden-room-hero | ✅ | ✅ (Home › Garden Rooms) | ✅ | — | — |
| `/house-extension` | ✅ | house-ext-hero | ✅ | ✅ (Home › House Extensions) | ✅ | — | — |
| `/gallery` | ✅ | landing_hero.png | ✅ | ✅ (Home › Gallery) | ✅ | — | — |
| `/about` | ✅ | landing_hero.png | ✅ | ✅ (Home › About Us) | ✅ | — | — |
| `/contact` | ✅ | landing_hero.png | ✅ | ✅ (Home › Contact Us) | ✅ | — | — |
| `/privacy` | ✅ | — | — | — | — | — | — |
| `/terms` | ✅ | — | — | — | — | — | — |

**Legend**: Legal pages (`/privacy`, `/terms`) get `canonicalUrl` and standard `robots` but no social/structured enrichment (low value, low traffic pages).
