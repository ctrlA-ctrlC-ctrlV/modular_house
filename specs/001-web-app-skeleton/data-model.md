# Data Model – Modular House MVP

This document enumerates entities, fields, constraints, and relationships derived from the feature spec. DB engine: PostgreSQL 18.x. ORM: Prisma.

## Conventions
- `id`: UUID v4 (string) primary key unless specified.
- `createdAt`/`updatedAt`: timestamptz; server-managed; indexed where relevant.
- `slug`: lowercase kebab-case; unique where applicable.
- Soft deletes not used for MVP (hard deletes allowed for content; submissions are retained until purge window).

## Entities

### User (Admin)
- id: uuid PK
- email: text UNIQUE (CI compare with lowercasing)
- passwordHash: text (Argon2id)
- roles: text[] (enum constrained at app level; default ['admin'])
- lastLoginAt: timestamptz NULL
- createdAt, updatedAt
Constraints/Rules:
- email required, valid format; password policies enforced on set/reset.

### Page
- id: uuid PK
- title: text NOT NULL
- slug: text NOT NULL UNIQUE
- heroHeadline: text
- heroSubhead: text
- heroImageId: uuid NULL (FK -> GalleryItem.imageId or separate media table; MVP references gallery image asset path)
- sections: jsonb NOT NULL DEFAULT '[]'  -- ordered content blocks
- seoTitle: text
- seoDescription: text
- lastModifiedAt: timestamptz NOT NULL DEFAULT now()
- createdAt, updatedAt
Constraints/Rules:
- slug unique (FR-029)
- seoTitle/seoDescription editable per page (FR-019)

### GalleryItem
- id: uuid PK
- title: text NOT NULL
- caption: text
- category: text CHECK (category IN ('garden-room','house-extension')) NOT NULL
- imageUrl: text NOT NULL  -- stored path/URL; validated size < 500KB at upload
- altText: text NOT NULL
- projectDate: date NULL
- publishStatus: text CHECK (publishStatus IN ('draft','published')) DEFAULT 'draft'
- createdAt, updatedAt
Indexes:
- category, publishStatus
Constraints/Rules:
- altText required before publish (FR-017)
- image size guidance enforced at upload (<500KB) (Assumptions)

### FAQ
- id: uuid PK
- question: text NOT NULL
- answer: text NOT NULL
- displayOrder: int NOT NULL DEFAULT 0
- createdAt, updatedAt

### Submission
- id: uuid PK
- payload: jsonb NOT NULL  -- { firstName, lastName?, email, phone, address, eircode, preferredProduct?, message?, consent:true }
- sourcePageSlug: text NOT NULL
- consentFlag: boolean NOT NULL
- consentText: text NOT NULL  -- snapshot of consent wording at submission time
- ipHash: text NOT NULL  -- salted hash of IP for rate-limiting/audit; never store raw IP
- userAgent: text NULL
- createdAt: timestamptz NOT NULL DEFAULT now()
- emailLog: jsonb NULL  -- { internal: success|failure+reason, customer?: success|failure+reason, attempts: n }
Indexes:
- createdAt DESC, sourcePageSlug, consentFlag
Constraints/Rules:
- Validate required fields (FR-005)
- Rate-limit metadata supports 10 submissions/hour by IP (FR-009)
- Data retention: purge after 24 months (FR-023)

### Redirect
- id: uuid PK
- sourceSlug: text NOT NULL UNIQUE
- destinationUrl: text NOT NULL
- active: boolean NOT NULL DEFAULT true
- createdAt: timestamptz NOT NULL DEFAULT now()
Constraints/Rules:
- Prevent redirect loops/invalid targets at write validation (Edge Cases)

## Relationships
- Page → GalleryItem (heroImageId) optional
- Content is otherwise loosely coupled; gallery items rendered via category filters
- Submissions reference pages by `sourcePageSlug` only; no FK to avoid hard coupling on slug changes (app enforces slug update order)

## Validation Rules (derived from spec)
- Enquiry Form (FR-005): `firstName`, `email`, `phone`, `address`, `eircode`, `consent:true` required; inline accessible errors; honeypot rejected silently.
- Gallery publish (FR-017): block publish without `altText`.
- Slugs (FR-029): prevent duplicates; confirm on attempts to override existing page.
- Image uploads: reject >500KB with accessible error message.
- Redirect creation: validate destination; prevent loops.

## State Transitions
- GalleryItem.publishStatus: `draft` → `published`; block if `altText` missing.
- Page updates: `updatedAt`/`lastModifiedAt` auto-bump; SEO fields editable.
- Submission lifecycle: immutable after creation; email log updated asynchronously with send outcomes and retries.

## Indexing & Performance Notes
- Pages: unique index on `slug`.
- Gallery: composite index (`category`, `publishStatus`, `createdAt DESC`).
- Submissions: index on `createdAt DESC` for admin list; partial index for `consentFlag = true` could speed exports.

## Security & Privacy
- Store only salted hash of IP (`ipHash`); do not persist raw IP.
- Redact email passwords and SMTP secrets from logs; redact submission PII in traces.
- Enforce least-privilege DB role for API (read/write segregated in future).
