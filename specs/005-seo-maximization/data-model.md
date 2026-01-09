# Data Model: SEO & Routing

**Spec**: [specs/005-seo-maximization/spec.md](../spec.md)

## Canonical Route Definition
To ensure consistency between the App runtime, Sitemap, and SSG build, a strict Route Configuration list is introduced.

### `AppRoute` Entity
A single source of truth for every public page.

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | The URL path (e.g., `/garden-room`) |
| `component` | `React.ComponentType` | The source component (lazy loaded or static) |
| `seo` | `SEOConfig` | (Optional) Static SEO metadata defaults |
| `sitemap` | `SitemapConfig` | (Optional) Frequency and priority for sitemap |

### `SEOConfig` Entity
Describes the metadata for the `<head>`.

```typescript
interface SEOConfig {
  title: string;           // Result: <title>{title} | Brand</title>
  description: string;     // Result: <meta name="description" content="..." />
  schema?: SchemaDef[];    // JSON-LD objects
}
```

### `SchemaDef` (JSON-LD)
Supports standard Schema.org types required by spec.

- **Organization**: Global, usually on Home/Contact.
- **Product**: For `/garden-room`, `/house-extension`.
- **LocalBusiness**: For `/contact`.
- **ImageObject**: For Gallery images.

## Site Structure (Proposed)

| Path | Component | Schema Type | Priority |
|------|-----------|-------------|----------|
| `/` | `Landing` | Organization | 1.0 |
| `/garden-room` | `GardenRoom` | Product | 0.9 |
| `/house-extension` | `HouseExtension` | Service | 0.9 |
| `/gallery` | `Gallery` | ImageGallery | 0.8 |
| `/about` | `About` | AboutPage | 0.7 |
| `/contact` | `Contact` | LocalBusiness | 0.8 |
| `/privacy` | `Privacy` | WebPage | 0.1 |
| `/terms` | `Terms` | WebPage | 0.1 |
