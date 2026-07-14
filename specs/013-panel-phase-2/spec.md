# Feature Specification: Admin Panel — Phase 2: Cookies & Performance Visualisation

**Feature Branch**: `013-panel-phase-2`
**Created**: 2026-07-14
**Status**: Draft
**Input**: User description: "Create spec for phase 2 of the admin panel implementation plan using BDD. Phase 2 covers cookies and performance visualisation: identify what cookies the project needs, plan and implement them across every current and future public page, and add a performance visualization section to the admin panel sidebar based on the Studio Admin template's analytics page."

## Clarifications

### Session 2026-07-14

- Reference design source: Studio Admin template at `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`, design system documented under `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard\.doc\design`. The performance-visualisation reference is the template's analytics dashboard page. The full phase plan lives at `.docs/new-admin-panel-design-brief.md`.
- **Scope confirmed by owner**: performance visualisation is in scope for Phase 2, superseding the design brief's Non-Goals entry and parking-lot entry for "website performance tracking and visualization". The brief's Non-Goals (section 4), parking lot (section 8), and "four sequential phases" wording in the TL;DR need updating to match the six-phase plan.
- **Data source confirmed by owner**: visitor measurement is collected first-party by the project itself and stored in the project's own database. No third-party analytics vendor is introduced.
- **Cookie model confirmed by owner**: the public site shows a notice banner stating that the site uses performance cookies only, with a single acknowledge action (notice-and-acknowledge model, not opt-in consent). The performance cookie carries a persistent anonymous identifier so cross-day returning visitors can be measured.
- This specification covers **Phase 2 only**. Later phases (data migration and editors, SSR, user/role management, customer management) are out of scope and referenced only as forward-compatibility constraints.

## Common Language *(glossary)*

| Term | Meaning |
|------|---------|
| Visitor | A person browsing the public site, identified only by an anonymous random identifier held in the performance cookie |
| Page view | One public page displayed to a visitor |
| Session | A visitor's consecutive page views; a session ends after 30 minutes without activity |
| Unique visitors | Count of distinct visitor identifiers seen in a time range |
| Returning visitor | A visitor whose identifier was first seen on an earlier calendar day |
| Traffic source | Where a visit arrived from, grouped as: direct, search, social, referral, or campaign |
| Performance cookie | The first-party cookie holding the anonymous visitor identifier used for measurement |
| Strictly necessary cookie | A cookie the product cannot function without (for example the admin panel's sign-in session cookies) |
| Acknowledgment | The visitor's recorded dismissal of the cookie notice banner — via the acknowledge button or the banner's close ("x") control; both have the same effect and lifetime |
| Cookie register | The single authoritative list of every cookie the product sets, rendered on the public cookie policy page |
| Customised range | The pop-up reached from the dashboard range selector's "More" option, offering 6-, 12-, and 16-month rolling windows and an exact start/end date choice |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor is informed about cookies and acknowledges the notice (Priority: P1)

A first-time visitor lands on any public page and sees a discreet notice banner explaining that the site uses performance cookies only, with a link to a full cookie policy page, an acknowledge button, and a close ("x") control. Closing the banner with the "x" is presumed to be acknowledgment. The banner never blocks reading or navigation. Once acknowledged — by either control — it stays gone across pages and future visits from that browser.

**Why this priority**: The notice is the transparency gate for everything else in this phase — measurement must not ship without it. It is independently valuable (legal transparency, trust) even before any dashboard exists.

**Independent Test**: Visit any public page in a fresh browser, confirm the banner appears with the stated wording and policy link, acknowledge it, browse further pages and revisit later to confirm it does not reappear, and open the policy page to confirm the full cookie register is listed.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on any public page, **When** the page loads, **Then** a notice banner is shown stating that the site uses performance cookies only, offering an acknowledge action, a close ("x") control, and a link to the cookie policy page, while the page content remains fully readable and navigable.
2. **Given** the banner is visible, **When** the visitor activates the acknowledge action, **Then** the banner closes immediately and does not reappear on any public page from that browser for the acknowledgment lifetime.
3. **Given** the banner is visible, **When** the visitor dismisses it with the close ("x") control, **Then** the dismissal is presumed to be acknowledgment and behaves identically to the acknowledge action — same immediate effect, same recorded lifetime, no reappearance.
4. **Given** the banner is visible, **When** the visitor follows the cookie policy link, **Then** a publicly reachable policy page lists every cookie the product sets — name, purpose, category, and duration — matching the cookie register.
5. **Given** a visitor who has not acknowledged, **When** they navigate across multiple public pages, **Then** the banner remains available on each page but never blocks content, navigation, or page interaction.
6. **Given** a keyboard-only or assistive-technology user, **When** the banner is shown, **Then** it is reachable and operable by keyboard (including both dismissal controls), announced to assistive technology, does not trap focus, and meets WCAG 2.1 AA.
7. **Given** a visitor who previously acknowledged but has since cleared their browser data, **When** they return, **Then** the banner is shown again as for a first-time visitor.
8. **Given** a new public page added in a later feature, **When** it is published, **Then** the banner behaviour applies to it automatically with no page-specific set-up.
9. **Given** any public page, **When** the banner appears, **Then** existing page content does not jump or shift.

---

### User Story 2 - Visits are measured anonymously and reliably (Priority: P1)

As a visitor browses the public site, each page view is recorded first-party — page, time, and traffic source — tied to an anonymous visitor identifier (held in the performance cookie) and a session. The measurement is invisible to the visitor, stores no personal data, and can never break or slow the public site.

**Why this priority**: Collection is the data foundation of the phase; the dashboard is only as good as the data behind it. It must start recording as early as possible because history cannot be backfilled.

**Independent Test**: Browse several public pages in a fresh browser and confirm page views, one visitor, and one session are recorded; return the next day and confirm the visit counts as returning; verify recorded data contains no personal information; disable the collection service and confirm the public site is unaffected.

**Acceptance Scenarios**:

1. **Given** a visitor loads a public page, **When** the page is displayed, **Then** a page-view record is captured containing the page identity, the time, the traffic source, the anonymous visitor identifier, and the session identifier.
2. **Given** the same visitor keeps browsing, **When** consecutive page views occur within the session inactivity window, **Then** they are grouped into the same session; after 30 minutes of inactivity the next page view starts a new session.
3. **Given** a visitor whose performance cookie is intact, **When** they return on a later calendar day, **Then** they are counted as a returning visitor, not a new one.
4. **Given** the collection service is slow or unavailable, **When** a visitor browses the public site, **Then** every page loads and functions normally with no user-visible error and no perceptible delay.
5. **Given** a known crawler or bot requests public pages, **When** its traffic is processed, **Then** it is excluded from all recorded metrics.
6. **Given** an administrator uses the admin panel, **When** they navigate admin pages, **Then** no visitor measurement is recorded for those pages.
7. **Given** any recorded measurement data, **When** it is inspected, **Then** it contains no personal data — no names, email addresses, full network addresses, precise locations, or identifiers shared with other sites.
8. **Given** a visitor arrives from a search engine, a social platform, another website, a campaign-tagged link, or directly, **When** the visit is recorded, **Then** the traffic source is captured and grouped as search, social, referral, campaign, or direct respectively.
9. **Given** a visitor whose browser blocks cookies or scripts, **When** they browse, **Then** the site functions fully; their traffic is either unmeasured or counted as new each time, and this is an accepted accuracy limit.

---

### User Story 3 - Administrator reviews site performance in the admin panel (Priority: P2)

A signed-in administrator opens the new "Analytics" entry in the admin sidebar — the panel's first real feature section — and sees the site's performance at a glance in the style of the Studio Admin template's analytics page: headline numbers (page views, unique visitors, sessions, returning-visitor rate, pages per session) with change indicators against the previous period, a realtime view of visitors active right now, the most-viewed pages, and where traffic comes from. They can switch the time range — from 24 hours up to a customised window with longer presets or exact start and end dates — and everything updates consistently.

**Why this priority**: This is the visible payoff of the phase, but it depends on Stories 1 and 2 producing data, so it lands after them. It independently proves the template's dashboard design ports into the Phase 1 shell.

**Independent Test**: With seeded or naturally collected measurement data, sign in, open Analytics from the sidebar, verify every widget shows correct numbers for the chosen range in both light and dark themes, switch ranges — including the customised-range pop-up presets and a custom start/end pair — and confirm consistent updates, and confirm the page is keyboard operable and mobile friendly.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator, **When** they open the sidebar, **Then** an Analytics navigation entry is visible and opens the performance dashboard inside the Phase 1 shell.
2. **Given** the dashboard is open, **When** the default view loads, **Then** a headline strip shows page views, unique visitors, sessions, returning-visitor rate, and pages per session for the selected range, each with a change indicator against the immediately preceding period of equal length.
3. **Given** the dashboard is open, **When** the administrator switches the time range (24 hours, 7 days, 28 days, 3 months, and "More", defaulting to last 3 months), **Then** every widget updates to the same range consistently.
4. **Given** the dashboard is open, **When** the administrator selects "More" from the range selector, **Then** a pop-up window opens offering: last 6 months, last 12 months, last 16 months (each counted back from the current date), and a custom option where the administrator picks a start date and an end date.
5. **Given** the customised-range pop-up is open, **When** the administrator applies one of its presets or a valid custom start/end date pair, **Then** the pop-up closes and every widget updates consistently to that range, with change indicators comparing against the immediately preceding period of equal length.
6. **Given** the custom option in the pop-up, **When** the chosen start date is after the end date, or the end date is in the future, **Then** the range cannot be applied and a clear message explains the problem; the dashboard keeps its previous range.
7. **Given** the dashboard is open, **When** visitors are active on the public site, **Then** a realtime panel shows the number of visitors active within the last 5 minutes and refreshes automatically without a manual reload.
8. **Given** the dashboard is open, **When** the administrator reviews content and acquisition, **Then** a most-viewed-pages list (ranked, with share of total views) and a traffic-sources breakdown (direct, search, social, referral, campaign) are shown for the selected range.
9. **Given** a time range containing no data, **When** it is selected, **Then** each widget shows a clear, friendly empty state instead of broken or misleading visuals.
10. **Given** dark mode or light mode is active, **When** the dashboard renders, **Then** all numbers, charts, and lists are legible and follow the template's visual language in both themes.
11. **Given** a keyboard-only user, **When** they use the dashboard, **Then** every control (tabs, range selector, customised-range pop-up and its date pickers, lists) is reachable and operable with visible focus.
12. **Given** an unauthenticated user, **When** they request the dashboard address directly, **Then** they are redirected to the admin login and see no data.
13. **Given** a small-viewport device, **When** the dashboard is opened, **Then** widgets stack into a single readable column with no horizontal scrolling, and the customised-range pop-up remains fully usable.

---

### User Story 4 - The cookie register stays the single source of truth (Priority: P3)

The product keeps one authoritative cookie register covering every cookie it sets — the public site's performance cookie and acknowledgment record, and the admin panel's strictly-necessary sign-in cookies. The public cookie policy page renders from this register, so future features add cookies by extending the register, never by reworking the banner or the policy page.

**Why this priority**: Governance keeps the transparency promise honest over time. It is lower urgency than shipping the notice, measurement, and dashboard, but it is what makes the phase's compliance durable across later phases.

**Independent Test**: Compare the cookies actually set by the product against the register and the rendered policy page (must match one-to-one); add a test entry to the register and confirm the policy page reflects it with no other change.

**Acceptance Scenarios**:

1. **Given** the shipped product, **When** the cookies it actually sets are audited, **Then** every one of them appears in the cookie register with name, purpose, category (strictly necessary or performance), and duration — and nothing else is set.
2. **Given** the cookie register, **When** the public cookie policy page is viewed, **Then** its cookie table matches the register exactly.
3. **Given** the admin panel's sign-in cookies, **When** the register is reviewed, **Then** they are documented as strictly necessary and correctly described, even though they never trigger a visitor-facing banner.
4. **Given** a future feature introduces a new cookie, **When** its register entry is added, **Then** the policy page presents it without any redesign of the banner or policy page.

---

### Edge Cases

- **Cookies blocked or cleared**: The site works fully without the performance cookie; such visitors are counted as new on each visit and the banner reappears. Accepted accuracy limit.
- **Content blockers**: Some browsers or extensions will block measurement entirely; the site must be unaffected and undercounting is accepted.
- **Collection outage or traffic spike**: If the collection service is down or saturated, measurement may be lost for that period but public pages must never slow down or error; collection sheds load rather than degrading the site.
- **Scripting disabled**: With scripting disabled, no banner is shown, no cookie is set, and no measurement occurs — the visitor is simply unmeasured and the site still works.
- **Banner closed with "x"**: Dismissing the banner via its close control is presumed acknowledgment — recorded with the same effect and lifetime as the acknowledge button, so the banner does not return on later pages or visits. There is no way to dismiss the banner without it counting as acknowledgment.
- **Multiple tabs**: Concurrent tabs from the same browser belong to the same visitor and session; acknowledging the banner in one tab takes effect in other tabs from their next navigation.
- **Refresh and back/forward navigation**: Each page display counts as a page view under standard semantics; no artificial de-duplication is required in this phase.
- **Long dwell**: A visitor idle past the session window starts a new session with their next page view, still as the same visitor.
- **Bot bursts**: Crawler spikes must not distort dashboard numbers; known automated traffic is excluded before metrics are computed.
- **Administrators browsing the public site**: They are counted like any other visitor; excluding staff traffic is out of scope for this phase.
- **Reporting consistency**: All dashboard figures are bucketed in one documented reporting timezone (Europe/London) so daily numbers do not shift with the viewer's location.
- **Empty or partial ranges**: Ranges before measurement began show empty states and comparison indicators degrade gracefully when the preceding period has no data; long presets (6, 12, 16 months) and custom ranges that reach before measurement began show the data that exists rather than erroring.
- **Custom range mistakes**: In the customised-range pop-up, a start date after the end date or an end date in the future cannot be applied; the administrator sees a clear message and the dashboard keeps its previous range.
- **Returning-visitor accuracy over long ranges**: Because the performance cookie lives 12 months, returning-visitor rates over windows longer than 12 months undercount long-absent visitors. Accepted accuracy limit.
- **Public site isolation**: The banner and measurement must not regress any public page's appearance, behaviour, search ranking signals, or measured performance.

## Requirements *(mandatory)*

### Functional Requirements

#### Cookie notice & policy

- **FR-001**: The public site MUST show a cookie notice banner to any visitor who has not acknowledged it, on every public page — current and future — with no page-specific set-up.
- **FR-002**: The banner MUST state that the site uses performance cookies only (besides strictly-necessary ones), MUST link to the cookie policy page, and MUST offer an acknowledge action and a close ("x") control; dismissing via the close control MUST be recorded as acknowledgment with identical effect and lifetime.
- **FR-003**: Acknowledgment MUST take effect immediately, persist for at least 12 months in that browser, and suppress the banner site-wide for its lifetime.
- **FR-004**: The banner MUST NOT obstruct reading, navigation, or interaction, MUST NOT cause visible layout shift when it appears, and MUST meet WCAG 2.1 AA including full keyboard and assistive-technology operability.
- **FR-005**: A cookie policy page MUST be publicly reachable from the banner and from the public site's standard page footer, and MUST present the full cookie register (name, purpose, category, duration per cookie).
- **FR-006**: The banner and measurement MUST NOT regress the public site's search-optimisation signals or measured page performance.

#### Visitor measurement

- **FR-007**: The system MUST record a page-view event for each public page displayed to a human visitor, capturing page identity, time, traffic source, anonymous visitor identifier, and session identifier.
- **FR-008**: The performance cookie MUST be first-party, MUST contain only a randomly generated anonymous identifier (no personal data), and MUST expire no later than 12 months after it is set.
- **FR-009**: Consecutive page views from one visitor MUST be grouped into a session that ends after 30 minutes of inactivity.
- **FR-010**: The system MUST distinguish returning visitors (identifier first seen on an earlier calendar day) from new visitors.
- **FR-011**: The traffic source of each visit MUST be captured and grouped into at least: direct, search, social, referral, and campaign (standard campaign-tagged links).
- **FR-012**: Measurement MUST be non-blocking: failure or unavailability of collection MUST NOT produce user-visible errors, broken behaviour, or perceptible slowdown on any public page.
- **FR-013**: Known automated traffic (crawlers, bots) MUST be excluded from all reported metrics.
- **FR-014**: Admin panel pages MUST NOT be measured.
- **FR-015**: Stored measurement data MUST contain no personal data — no names, email addresses, full network addresses, precise locations, or identifiers shared across sites. Network addresses MAY be used transiently (for example, for bot filtering) but MUST NOT be persisted in an identifiable form.
- **FR-016**: Raw page-view records MUST be retained long enough to serve the longest selectable dashboard range and its preceding comparison period (at least 32 months); aggregated statistics MAY be retained indefinitely.

#### Performance dashboard

- **FR-017**: The admin sidebar MUST include an Analytics navigation entry opening the performance dashboard inside the Phase 1 shell; the dashboard MUST require an authenticated admin session and is readable by every admin role in this phase.
- **FR-018**: The dashboard MUST present, for the selected time range: page views, unique visitors, sessions, returning-visitor rate, and pages per session, each with a change indicator against the immediately preceding period of equal length.
- **FR-019**: The dashboard's range selector MUST offer: last 24 hours, last 7 days, last 28 days, last 3 months (the default), and a "More" option. "More" MUST open a customised-range pop-up offering: last 6 months, last 12 months, last 16 months (each a rolling window ending on the current date), and a custom range defined by an administrator-picked start date and end date. A custom range whose start date is after its end date, or whose end date is in the future, MUST be rejected with a clear message. Changing the range by any of these means MUST update all widgets consistently.
- **FR-020**: The dashboard MUST show the count of visitors active within the last 5 minutes, refreshed automatically without manual reload.
- **FR-021**: The dashboard MUST list the most-viewed pages (ranked, with share of total views) and the traffic-source breakdown for the selected range.
- **FR-022**: The dashboard MUST follow the Studio Admin template's analytics page design — layout, tokens, chart styling — in light and dark themes, remain fully keyboard operable, and adapt to small viewports without horizontal scrolling.
- **FR-023**: Every widget MUST present a clear empty state when its range holds no data.
- **FR-024**: The dashboard MUST accommodate later additions (new headline metrics, panels, or tabs) without reworking existing widgets.

#### Cookie governance

- **FR-025**: A single authoritative cookie register MUST describe every cookie the product sets — public site and admin panel — with name, purpose, category (strictly necessary or performance), and duration; the policy page MUST match it exactly.
- **FR-026**: The admin panel's strictly-necessary sign-in cookies MUST be documented in the register even though they require no visitor-facing banner.
- **FR-027**: Introducing a future cookie MUST require only a new register entry for the policy page to present it; the banner and policy page MUST NOT need redesign.
- **FR-028**: The notice mechanism MUST be extensible to an opt-in accept/decline model without replacement, should the compliance posture change later.

### Key Entities

- **Page View Event**: One public page displayed to a visitor — page identity, time, traffic source, visitor identifier, session identifier. The atomic unit all metrics derive from.
- **Visitor**: An anonymous identity represented only by the random identifier in the performance cookie; carries a first-seen date enabling new-versus-returning classification. Holds no personal attributes.
- **Session**: A group of one visitor's consecutive page views bounded by the 30-minute inactivity window.
- **Traffic Source**: The arrival classification of a visit — direct, search, social, referral, or campaign — derived from arrival context and standard campaign-tagged links.
- **Cookie Register Entry**: One cookie's public documentation — name, purpose, category, duration — the source the policy page renders from.
- **Acknowledgment**: The per-browser record that the cookie notice was dismissed, with its own lifetime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public pages — including any page added after this phase ships — show the notice to first-time visitors and record page views with zero page-specific configuration.
- **SC-002**: After one acknowledgment, a visitor sees no banner again from the same browser for 12 months.
- **SC-003**: Independent page-quality audits of the public site (performance, search-optimisation, accessibility) score no lower after this phase than the pre-phase baseline.
- **SC-004**: A visitor who returns on a later calendar day with the cookie intact is reported as returning, not new, verified across at least a two-day window.
- **SC-005**: An administrator can answer "How many visitors last week, which pages were most viewed, and where did traffic come from?" within 30 seconds of opening the admin panel.
- **SC-006**: A new public-site visit is reflected in the realtime panel within 60 seconds.
- **SC-007**: The dashboard presents the default 3-month view within 2 seconds, and the longest selectable range (16 months, or an equivalent custom range) within 5 seconds, with the full retention period populated at typical site traffic volumes.
- **SC-008**: An audit of stored measurement data finds zero items of personal data.
- **SC-009**: With the collection service disabled, public pages remain fully functional with no user-perceptible difference.
- **SC-010**: Side-by-side comparison of the dashboard against the template's analytics page is approved in both light and dark themes.
- **SC-011**: The cookies actually set by the product match the cookie register and policy page one-to-one.

## Assumptions

- **Notice model is an owner decision (2026-07-14)**: the banner informs and is acknowledged; it does not offer reject. UK ICO guidance generally expects opt-in consent for performance cookies, so this is a consciously accepted compliance risk; FR-028 keeps an opt-in upgrade cheap if the posture changes.
- The performance cookie and the acknowledgment each persist 12 months; the session inactivity window is 30 minutes; the reporting timezone is Europe/London.
- Raw events are retained at least 32 months so the longest selectable dashboard range (last 16 months) and its preceding comparison period stay answerable; this supersedes the earlier 13-month draft value. The 16-month preset is taken as intentional (not a rounding of 18); anonymous data makes the longer retention low-risk.
- Measurement begins when this phase ships; there is no historical backfill, so early ranges will be sparse and must degrade gracefully.
- The template's analytics page is followed for its Overview content; its Audience, Acquisition, Engagement, and Conversions tabs are placeholders even in the template and are out of scope. The realtime panel's per-country breakdown is deferred (no geographic lookup this phase) and adapts to an active-visitor count with current pages.
- The Analytics dashboard becomes the default landing view after sign-in, replacing the Phase 1 "Coming Soon" content area; the sidebar keeps signalling future sections as such.
- Every admin role can view the dashboard in this phase (read-only feature); per-role visibility is revisited when the RBAC matrix gains an analytics column in later phases.
- Staff or administrator visits to the public site are not excluded from metrics in this phase.
- The design brief requires follow-up edits outside this spec: remove "website performance tracking and visualization" from Non-Goals (section 4) and the parking lot (section 8), and correct the TL;DR's "four sequential phases" to the current six-phase plan.

## Dependencies

- Phase 1 (feature `012-panel-phase-1`) shipped: admin shell, sidebar, theming, authentication, and session handling that this phase's dashboard renders inside and authenticates against.
- No new external vendors or services are introduced; collection, storage, and presentation are first-party.

## Out of Scope

- Opt-in consent management, reject options, or a cookie preference centre (owner decision; see FR-028 for the extension point).
- Conversion, funnel, e-commerce, or custom-event tracking; A/B testing.
- Technical performance monitoring (page-speed metrics, error tracking, uptime alerting).
- Geographic and device breakdowns of visitors.
- Data export, scheduled reports, or alerting from the dashboard.
- Session replay, per-visitor browsing histories, or any individual-level profiling.
- Excluding staff traffic from metrics.
- Backfilling traffic history from before this phase ships.
