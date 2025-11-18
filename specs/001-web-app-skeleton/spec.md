# Feature Specification: Web App Skeleton (Modular House MVP)

**Feature Branch**: `001-web-app-skeleton`  
**Created**: 2025-11-18  
**Status**: Draft  
**Input**: Non-Technical MVP skeleton description (pages, forms, mail, lightweight admin, content model, accessibility, SEO, privacy, performance budgets)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor submits enquiry/quote successfully (Priority: P1)

A site visitor reaches any page and submits the unified enquiry/quote form receiving a confirmation message; internal recipients receive an email; submission stored with consent recorded.

**Why this priority**: Direct lead generation is core business value; form reliability unblocks marketing usage immediately.

**Independent Test**: Fill form with valid data → observe success message, internal email arrival, optional customer email, stored record visible in admin list. No other stories required.

**Acceptance Scenarios**:

1. **Given** visitor on Contact page with empty form, **When** completing required fields and submits, **Then** success message shows and internal email received.
2. **Given** visitor omits a required field, **When** submitting, **Then** inline accessible error text displayed adjacent to field and submission blocked.
3. **Given** honeypot field filled (simulated bot), **When** submitting, **Then** submission rejected silently (no email, not stored) and user sees generic error.
4. **Given** valid submission, **When** email transient failure occurs, **Then** system retries (up to budget) and logs failure if still unsuccessful.

---

### User Story 2 - Editor updates page & gallery content (Priority: P2)

An authenticated admin user signs in, edits hero text and image on a product page, adds a new gallery item with category, and exports submissions to CSV.

**Why this priority**: Enables rapid content iteration without developer involvement; supports marketing and portfolio building.

**Independent Test**: Perform content changes via admin → refresh public pages → see updated hero and new gallery item. Export CSV lists recent submissions. Can be tested without form implementation (submission list may show placeholders).

**Acceptance Scenarios**:
1. **Given** admin authenticated, **When** editing Garden Room hero headline and saving, **Then** updated headline appears live on page refresh.
2. **Given** admin authenticated, **When** adding new gallery item with category "Garden Room" and alt text, **Then** item appears under Gallery with correct filter and accessible caption.
3. **Given** admin authenticated, **When** requesting submissions export, **Then** CSV downloads containing timestamp, source page, consent flag.
4. **Given** unauthenticated user, **When** attempting to access admin URL, **Then** redirected to login.

---

### User Story 3 - Visitor browses accessible product & gallery pages (Priority: P3)

Visitor navigates via header to product pages and gallery, filters gallery, opens lightbox, uses prev/next button navigation, sees proper focus states and alt text.

**Why this priority**: Demonstrates marketing pages and baseline accessibility, enabling CSS skinning and early stakeholder review.

**Independent Test**: Load pages with placeholder content → verify navigation highlighting, keyboard traversal, gallery filter & lightbox operation, 404 page behavior independent of forms or admin.

**Acceptance Scenarios**:
1. **Given** visitor on Landing page, **When** pressing Tab through header, **Then** each nav item receives visible focus and Enter navigates correctly.
2. **Given** visitor on Gallery page, **When** selecting House Extension filter, **Then** only matching items shown.
3. **Given** visitor opens a gallery item, **When** pressing prev button in lightbox , **Then** the previouse item in the slide will display.
4. **Given** visitor opens a gallery item, **When** pressing next button in lightbox , **Then** the next item in the slide will display.
5. **Given** visitor opens a gallery item, **When** pressing Escape, **Then** lightbox closes and focus returns to thumbnail.
6. **Given** visitor opens a gallery item, **When** pressing 'x' button in lightbox, **Then** lightbox closes and focus returns to thumbnail.
4. **Given** visitor requests unknown URL, **When** page resolves, **Then** branded 404 displays links back to primary pages.

---

### (Archive, **ingor this section**) User Story 4 - Privacy & SEO baseline (Priority: P4)
Cookie consent banner, unique meta titles/descriptions editable per page, sitemap & robots served. (Deferred if capacity limited.)
**Independent Test**: Toggle consent, verify banner records state; edit SEO fields → page markup updated.

---

### Edge Cases

- Honeypot filled (spam): submission rejected silently.
- Email service outage: retries limited then logged with reason; user sees generic success if storage succeeded (avoid leaking failure details).
- Oversized gallery image: upload rejected with accessible error; guidance text displayed.
- Missing alt text for gallery item: admin save blocked until alt text supplied.
- Duplicate slug attempt: validation error; cannot override existing page without change confirmation.
- Redirect loop or invalid target: admin validation prevents creation.
- Data retention expiry job missing: submissions older than retention window flagged (monitor alert) until purged.
- Consent unchecked: form submission blocked with error linking Privacy page.
- Lightbox opened on mobile small viewport: layout adjusts; keyboard accessibility preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render all MVP pages with placeholder content (Landing, Product pages, Gallery, About, Contact, Privacy, Terms, 404).
- **FR-002**: System MUST provide global header with nav highlighting current page and phone CTA.
- **FR-003**: System MUST provide global footer with required links (Privacy, Terms) and contact info.
- **FR-004**: System MUST implement a unified enquiry/quote form accessible from Contact and CTA links.
- **FR-005**: Form MUST enforce required fields (first name, email, phone, address, Eircode, consent) with inline accessible errors.
- **FR-006**: Form MUST store submissions (payload, timestamp, source page, consent flag, consent text snapshot).
- **FR-007**: System MUST send internal notification email on successful submission.
- **FR-008**: System SHOULD send optional customer confirmation email (toggle configurable).
- **FR-009**: System MUST implement spam mitigation (honeypot + simple IP rate limit e.g., 10 submissions/hour).
- **FR-010**: System MUST expose lightweight admin authentication (email+password + MFA optional assumption) protecting content management.
- **FR-011**: Admin MUST allow create/edit of Pages (hero fields, sections, SEO fields).
- **FR-012**: Admin MUST allow create/edit of Gallery items (title, caption, category, image, alt text).
- **FR-013**: Admin MUST allow create/edit of FAQs (question, answer).
- **FR-014**: Admin MUST display list of Submissions with consent status.
- **FR-015**: Admin MUST export submissions to CSV (UTF-8) including required fields.
- **FR-016**: System MUST provide gallery filtering (Garden Room vs House Extension) and lightbox with keyboard support.
- **FR-017**: System MUST enforce alt text for images entered via admin before publish.
- **FR-018**: System MUST serve sitemap.xml and robots.txt with editable entries (pages + gallery paths).
- **FR-019**: System MUST allow editable page titles and meta descriptions (SEO fields) per page.
- **FR-020**: System MUST implement cookie consent banner for non-essential cookies and store user choice.
- **FR-021**: System MUST support 301 redirect entries (slug → target) editable via admin.
- **FR-022**: System MUST serve branded 404 page for unknown routes linking key pages.
- **FR-023**: System MUST record and enforce data retention for submissions (assumed 24 months) enabling purge scheduling.
- **FR-024**: System MUST log email send attempts and outcomes (success/failure reason) without exposing secrets.
- **FR-025**: System MUST allow restyling via CSS replacement without modifying HTML templates (stable semantic structure & hooks).
- **FR-026**: System MUST provide markup guide (components, class naming) accessible within repository/docs.
- **FR-027**: System MUST ensure gallery images lazy-load (placeholder until in viewport) to meet performance budget.
- **FR-028**: System MUST provide accessible focus states and keyboard navigation for all interactive elements (nav, form controls, lightbox controls).
- **FR-029**: System MUST validate and prevent duplicate slugs on page creation.
- **FR-030**: System MUST store redirect definitions without code changes (data-driven lookup before 404).

No critical ambiguities remain; defaults documented in Assumptions.

### Key Entities *(include if feature involves data)*

- **Page**: Represents a public page; attributes: title, slug, hero (headline, subhead, image ref), sections (ordered blocks), SEO fields (title tag, meta description), last modified timestamp.
- **GalleryItem**: Represents visual project example; attributes: title, caption, category (enum: garden-room | house-extension), image refs, alt text, optional project date, publish status.
- **FAQ**: Represents Q&A pair; attributes: question, answer, display order.
- **Submission**: Represents form submission; attributes: payload (fields), timestamp, source page slug, consent flag, consent text snapshot, rate-limit metadata.
- **Redirect**: Represents mapping from old slug to target URL; attributes: source slug, destination URL, created timestamp, active flag.
- **User (Admin)**: Represents authenticated editor; attributes: email, password hash, roles (admin), MFA secret (optional), last login timestamp.

### Assumptions

- Data retention: 24 months for submissions then purge.
- Customer confirmation emails: enabled by default; can be disabled in config.
- Rate limiting: 10 submissions per IP per rolling hour window.
- Admin auth: email/password with MFA optional (future enforcement can be added without schema change).
- Image size guidance: <500KB per gallery image; larger rejected.
- Accessibility level: WCAG 2.1 AA targeted; lightbox compliance limited to keyboard + focus management (screen reader labeling included).
- Cookie consent scope: only analytics or marketing scripts flagged as non-essential.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of valid form submissions complete (no validation errors) in under 30 seconds of user time including confirmation display.
- **SC-002**: Internal notification email delivery observed in <60 seconds for 95% of submissions (excluding external provider outages).
- **SC-003**: Restyling exercise (swap CSS only) achieves full visual overhaul of at least 3 pages in <1 hour without HTML edits.
- **SC-004**: 100% of public pages have unique editable title + meta description populated by admin.
- **SC-005**: 100% interactive elements pass keyboard navigation & visible focus checks (audit script/manual QA).
- **SC-006**: Initial HTML payload per page (excluding images) ≤100KB; gallery images lazy-loaded with <10 blocking resources.
- **SC-007**: Accessibility spot-check yields ≥90% compliance items (alt text, headings order, form labels, lightbox keyboard close) on first audit.
- **SC-008**: Content editor can add a new GalleryItem and see it live within <2 minutes end-to-end.
- **SC-009**: Submissions export produces CSV containing ≥98% of stored submissions (allowing ≤2% transient misses only if retention job executing).
- **SC-010**: Zero critical security/privacy violations in acceptance review (unencrypted transport, missing consent capture, unauthenticated admin access).
