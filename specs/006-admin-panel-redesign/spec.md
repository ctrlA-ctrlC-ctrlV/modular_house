# Feature Specification: Admin Panel Redesign

**Feature Branch**: `006-admin-panel-redesign`  
**Created**: January 21, 2026  
**Status**: Approved 
**Input**: Approved design document: `.docs/admin_page_design.md`

---

## Overview

Redesign the existing admin panel to provide a cohesive, professional-grade content management experience. The current implementation lacks unified navigation, responsive design, loading states, error boundaries, audit logging, role-based access control, and accessibility compliance. This redesign transforms the admin experience with a unified layout shell, design system, enhanced security, and improved usability.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Dashboard Access (Priority: P1)

As an administrator, I want to see a dashboard with key metrics and quick actions when I log in, so I can quickly understand the system status and navigate to common tasks.

**Why this priority**: The dashboard is the entry point for all admin users and provides immediate value by showing system health and enabling quick access to frequent tasks.

**Independent Test**: Can be fully tested by logging in as admin and verifying dashboard loads with stat cards, recent activity, and quick action buttons - delivers immediate visibility into system state.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I navigate to `/admin`, **Then** I see stat cards showing counts for Pages (published and draft), Gallery items (published and draft), Submissions (with today's count), and Redirects (active and inactive).
2. **Given** I am on the dashboard, **When** I view the submission metric, **Then** I see a bar chart of the current  7 day submission (today and 6 day before.
3. **Given** I am on the dashboard, **When** I view the activity feed, **Then** I see the 5 most recent system activities with timestamps.
4. **Given** I am on the dashboard, **When** I click a quick action button, **Then** I am navigated to the corresponding feature (e.g., "New Page" → page editor).

---

### User Story 2 - Unified Admin Layout Navigation (Priority: P1)

As an admin user, I want a persistent sidebar navigation and top bar that remains consistent across all admin pages, so I can efficiently navigate between sections without losing context.

**Why this priority**: Unified navigation is foundational to all other admin features and directly impacts productivity for every admin task.

**Independent Test**: Can be tested by navigating between any admin pages and verifying sidebar and top bar persist with correct active states.

**Acceptance Scenarios**:

1. **Given** I am on any admin page, **When** I view the interface, **Then** I see a persistent sidebar with navigation links and a top bar with breadcrumbs.
2. **Given** the sidebar is expanded, **When** I click the collapse toggle, **Then** the sidebar collapses to icon-only mode (64px width) with smooth animation.
3. **Given** I navigate to a nested page, **When** I view the breadcrumbs, **Then** they show the correct hierarchy path, **AND** each breadcrumb link to representative page.

---

### User Story 3 - Pages Management with Enhanced Editing (Priority: P2)

As a content editor, I want to manage website pages with a rich editing interface including drag-drop section reordering and auto-save, so I can efficiently update content without fear of losing work.

**Why this priority**: Pages are the core content of the website; improving the editor directly impacts content quality and editor productivity.

**Independent Test**: Can be tested by creating/editing a page, reordering sections, and verifying auto-save indicator shows saves occur automatically.

**Acceptance Scenarios**:

1. **Given** I am on the page list that is **not** the last page, **When** I click on "Next" button, **Then** the table should render the next set of entries, **And** the page indicator should update to the next number.
2. **Given** I am on the page list that is **not** the first page, **When** I click on "Previous" button, **Then** the table should render the previous set of entries, **And ** the page indicator should decrement by one.
3. **Given** the table is populated with data, **When** I look ate the pagination footer, **Then** I should see the current page number versus the total number of pages.
4. **Given** I am on the page list and type into the search field, **When** I entry search text, **Then** page table filters to show matching records after a brief debounce delay.
5. **Given** I am on the pages list, **When** I click "New Page" or edit an existing page, **Then** I see a two-column editor with content fields on the left and SEO/settings on the right.
6. **Given** I am editing a page with multiple sections, **When** I drag a section to a new position, **Then** the section order updates and the change is auto-saved.
7. **Given** I have unsaved changes, **When** I try to navigate away, **Then** I see a warning dialog asking to confirm leaving.
8. **Given** I am editing a page, **When** I click "Preview", **Then** a new tab opens showing the page as it will appear to visitors.

---

### User Story 4 - Gallery Management with Bulk Operations (Priority: P2)

As an admin, I want to manage gallery items with bulk selection, filtering by category/status, and grid/list view toggle, so I can efficiently organize large numbers of images.

**Why this priority**: Gallery management is frequently used and bulk operations significantly reduce time spent on repetitive tasks.

**Independent Test**: Can be tested by uploading images, selecting multiple items, and performing bulk publish/delete operations.

**Acceptance Scenarios**:

1. **Given** I am on the gallery page, **When** I toggle the view mode, **Then** the display switches between grid view (thumbnails) and list view (table).
2. **Given** I select multiple gallery items, **When** I see the bulk action bar, **Then** I can choose to Publish, Delete, or Change Category for all selected items.
3. **Given** I filter by "Draft" status, **When** the filter is applied, **Then** only draft items are displayed.
4. **Given** I upload a new image via drag-and-drop, **When** the upload completes, **Then** the new item appears in the gallery with Draft status.

---

### User Story 5 - Data Tables with Sorting and Filtering (Priority: P2)

As an admin, I want data tables that support column sorting, filtering, pagination, and bulk selection, so I can efficiently find and manage records.

**Why this priority**: Data tables are used across multiple admin sections; a reusable component improves consistency and reduces development effort.

**Independent Test**: Can be tested on any list page (Pages, Submissions, Redirects) by sorting columns, filtering, and selecting multiple rows.

**Acceptance Scenarios**:

1. **Given** I am viewing a data table, **When** I click a column header, **Then** the table sorts by that column (ascending, then descending on second click).
2. **Given** I type in the search field, **When** I enter search text, **Then** the table filters to show matching records after a brief debounce delay.
3. **Given** there are more records than fit on one page, **When** I use pagination controls, **Then** I can navigate between pages and change page size.

---

### User Story 6 - Submissions Viewing and Export (Priority: P2)

As an admin, I want to view form submissions with filtering by date range and source page, and export data to CSV, so I can analyze leads and respond to inquiries.

**Why this priority**: Submissions represent business leads; efficient access and export capabilities support sales and customer service workflows.

**Independent Test**: Can be tested by viewing submissions, filtering by date/source, clicking to expand details, and exporting to CSV.

**Acceptance Scenarios**:

1. **Given** I am on the submissions page, **When** I filter by date range (e.d. Last 30 days), **Then** only submissions within that range are shown.
2. **Given** I am on the submissions page, **When** I filter by Source (e.g. "/contact"), **Then** only submissions from that source are shown.
3. **Given** I am on the page list that is **not** the last page, **When** I click on "Next" button, **Then** the table should render the next set of entries, **And** the page indicator should update to the next number.
4. **Given** I am on the page list that is **not** the first page, **When** I click on "Previous" button, **Then** the table should render the previous set of entries, **And ** the page indicator should decrement by one.
5. **Given** the table is populated with data, **When** I look ate the pagination footer, **Then** I should see the current page number versus the total number of pages.
6. **Given** I type into the search field, **When** I entry search text, **Then** page table filters to show matching records in "Form Data" after a brief debounce delay.
7. **Given** I click on a submission row, **When** the detail panel expands, **Then** I see all form data, consent status, and submission metadata.
8. **Given** I click "Export CSV", **When** the export completes, **Then** a CSV file downloads with all visible submissions.

---

### User Story 7 - Role-Based Access Control (Priority: P3)

As a super admin, I want to assign roles (Admin, Editor, Viewer) to users with different permission levels, so I can control who can modify vs. only view content.

**Why this priority**: RBAC improves security and enables delegation to team members with appropriate access levels, but the system functions without it initially.

**Independent Test**: Can be tested by creating users with different roles and verifying they see/can access only permitted features.

**Acceptance Scenarios**:

1. **Given** I am logged in as a super admin, **When** I create or edit a Role definition, **Then** I should see a list of all system resources, **And** I should be able to toggle specific permissions for each resource
2. **Given** I am logged in as a super admin, **When** I create a new user or edit an existing user profile, **Then** I I should see a "Role" selection input, **And** I should be able to assign one of the predefined roles to that user.
3. **Given** I am **not** logged in as a super admin, **When** I view the global navigation, **Then** I should see menu items that is opened to my role, **but** I should **not** see items that is not open to my role.
4. **Given** I am **not** logged in as a super admin, **When** I navigate to a menu item, **Then** I should **only** see tools or actionable buttons or table that is opened to my role.

---

### User Story 8 - Theme Switching (Light/Dark Mode) (Priority: P3)

As an admin user, I want to switch between light and dark themes, so I can use the interface comfortably in different lighting conditions.

**Why this priority**: Theme switching is a modern UX expectation but does not affect core functionality.

**Independent Test**: Can be tested by toggling the theme switch and verifying all UI elements update to the new color scheme.

**Acceptance Scenarios**:

1. **Given** I am in light mode, **When** I toggle the theme switch, **Then** the interface smoothly transitions to dark mode.
2. **Given** I set dark mode, **When** I close and reopen the browser, **Then** my theme preference is remembered.

---

### User Story 9 - Session Management and Security (Priority: P3)

As an admin, I want the system to warn me before my session expires and automatically log me out after inactivity, so my account remains secure.

**Why this priority**: Security is important but the existing JWT auth provides baseline protection; enhanced session management adds defense-in-depth.

**Independent Test**: Can be tested by logging in, waiting for idle timeout warning, and verifying automatic logout after continued inactivity.

**Acceptance Scenarios**:

1. **Given** I have been idle for 25 minutes, **When** the warning threshold is reached, **Then** I see a modal warning that my session will expire in 5 minutes.
2. **Given** I ignore the warning, **When** 30 minutes of inactivity pass, **Then** I am automatically logged out and redirected to login.
3. **Given** my access token expires, **When** I make an API request, **Then** the token is silently refreshed using the refresh token without interrupting my work.

---

### User Story 10 - Accessible Keyboard Navigation (Priority: P3)

As an admin user who relies on keyboard navigation, I want all admin features to be accessible via keyboard, so I can use the interface without a mouse.

**Why this priority**: Accessibility compliance (WCAG 2.1 AA) is a requirement but can be implemented incrementally after core features.

**Independent Test**: Can be tested by navigating the entire admin interface using only Tab, Enter, Escape, and Arrow keys.

**Acceptance Scenarios**:

1. **Given** I am using keyboard navigation, **When** I press Tab, **Then** focus moves to the next interactive element in logical order.
2. **Given** a modal is open, **When** I press Escape, **Then** the modal closes and focus returns to the trigger element.
3. **Given** I am in the sidebar, **When** I use Arrow keys, **Then** I can navigate between menu items.

---

### Edge Cases

- System-Wide & Architectural

  - API Latency/Timeout: What happens if an API call takes >10 seconds? $\rightarrow$ UI must show a generic loading skeleton initially, then transition to a specific timeout error message with a "Retry" button; ensure no duplicate transactions occur if the user clicks retry while the previous request is hanging.
  - **Concurrent Session Modification: What happens if an admin modifies a record (e.g., Page or Role) that another admin has just deleted? $\rightarrow$ The API returns a `404 Not Found`; the UI must catch this, display a "Resource no longer exists" toast, and refresh the current view/list.
  - Token Expiry during Multi-step Action: What happens if the refresh token expires exactly while a user is performing a drag-and-drop sort? $\rightarrow$ The action fails; the system must store the intended state locally (if possible), force a login modal (overlay), and retry the action upon successful re-authentication.
- US 1: Admin Dashboard Access
  - Zero-Data State (Cold Start): What happens when the system is brand new with 0 submissions or pages? $\rightarrow$ Stat cards display "0" rather than null/undefined; Charts display a "No data available yet" empty state placeholder instead of broken axes.
  - Partial API Failure: What happens if the Stats service is up but the Activity Feed service is down? $\rightarrow$ The dashboard loads successfully; the failed widget displays an individual error state ("Unable to load activity"), preventing the entire dashboard from crashing.

- US 2: Unified Admin Layout Navigation
  - Deep Linking/Breadcrumbs: What happens if a user navigates directly to a deep URL (e.g., /admin/pages/edit/123) without passing through the parent list? $\rightarrow$ The system must reconstruct the breadcrumb trail (Home > Pages > Edit) based on the route hierarchy, ensuring the "Pages" link is clickable and leads to the correct state.
  - Mobile Menu Overlay: What happens on mobile when the menu is open and the user clicks the "Back" browser button? $\rightarrow$ The menu should close (treating the menu state as a history entry or utilizing an overlay trap) rather than navigating the user back to the login page.

- US 3: Pages Management
  - Stale Data Overwrite (Optimistic Locking): What happens if User A opens a page, User B edits and saves it, and then User A tries to save? $\rightarrow$ Backend rejects the save with a 409 Conflict. UI displays a "Content has changed externally" diff modal, allowing User A to choose "Overwrite" or "Save as Copy."
  - Pagination Boundary: What happens if a user is on Page 5 of the list, and deletes the only item on that page? $\rightarrow$ The table should automatically navigate the user to Page 4.
  - Rich Text Paste Formatting: What happens if a user pastes content from MS Word with complex inline styles? $\rightarrow$ The editor sanitizer must strip non-allowed styles (fonts, colors) while preserving semantic structure (H1, bold, lists) to prevent breaking the site layout.

- US 4: Gallery Management
  - Orphaned Records: What happens if an image upload completes but the metadata save fails? $\rightarrow$ The system should run a scheduled cron job to clean up temporary files in storage that do not have associated database records after 24 hours.

- US 5: Data Tables
  - Debounce Race Conditions: What happens if a user types "garden", clears it, and types "house" rapidly? $\rightarrow$ Ensure the API request for "garden" is cancelled (aborted) if "house" is typed, ensuring the results displayed always match the current input value, not the last response to arrive (out-of-order responses).
  - Sorting Null Values: What happens when sorting a column with optional data (e.g., "Last Updated")? $\rightarrow$ Null/Empty values should always stay at the bottom of the list regardless of Ascending/Descending sort order to maintain readability.

- US 6: Submissions
  - Malicious Payload Display (XSS): What happens if a bot submits a form with `<script>` tags in the name field? $\rightarrow$ The Admin Submissions view must strictly escape all HTML entities when rendering the table and details view to prevent Cross-Site Scripting attacks against the administrator.
  - Massive Export: What happens if a user tries to export 1,000,000 records? $\rightarrow$ The request should be offloaded to a background job; the user receives a notification/email with a download link when ready, rather than blocking the browser thread.

- US 7: Role-Based Access Control (RBAC)
  - Self-Lockout Prevention: What happens if a Super Admin tries to remove the "Admin" role from their own account or delete the last remaining Super Admin user? $\rightarrow$ The system must block this action with a validation error: "You cannot revoke your own administrative privileges or delete the last active Super Admin."
  - Resource Permission Conflict: What happens if a Role has view: false for "Pages" but edit: true for "Pages"? $\rightarrow$ The logic should enforce hierarchy: verifying edit permission implies view permission. Alternatively, the UI should auto-check "View" if "Edit" is checked.

- US 8: Theme Switching
  - System vs. User Preference: What happens on the first visit? $\rightarrow$ The system detects the OS/Browser preference (prefers-color-scheme). If the user manually toggles the switch, that local preference overrides the OS setting and is persisted in localStorage.

- US 9: Session Management
  - Multi-Tab Consistency: What happens if the user logs out in Tab A? $\rightarrow$ Tab B should detect the local storage/cookie change (via storage event listener) and redirect to the login screen immediately to prevent the user from performing actions in a stale session.
  - Clock Skew: What happens if the client's computer clock is significantly different from the server? $\rightarrow$ Token expiration validation should allow for a small clock skew window (leeway), or rely strictly on server-side validation responses rather than client-side token parsing alone.

- US 10: Accessible Keyboard Navigation
  - Focus Trapping: What happens when a modal opens? $\rightarrow$ Keyboard focus must be trapped inside the modal. Pressing Tab on the last element of the modal should cycle back to the first element of the modal, not the background page.
  - Skip Navigation: What happens when a keyboard user lands on the page? $\rightarrow$ A "Skip to Main Content" link should appear on the first Tab press, allowing users to bypass the sidebar navigation.


---

## Requirements *(mandatory)*

### Functional Requirements

#### Global Layout & Navigation (US-2, US-8, US-10)
- **FR-001**: System MUST provide a unified admin layout with persistent sidebar navigation (256px expanded, 64px collapsed) and top bar (64px height).
- **FR-002**: System MUST implement breadcrumb navigation in the top bar that reflects the current route hierarchy and links back to parent views.
- **FR-003**: Sidebar MUST support a collapsible state (icon-only) that persists to local storage; animation between states MUST complete within 200ms.
- **FR-004**: System MUST be responsive; on viewports < 1024px, the sidebar MUST convert to a slide-out drawer pattern controlled by a hamburger menu.
- **FR-005:** System MUST persist the user's Theme preference (Light/Dark) in `localStorage` and strictly adhere to the `prefers-color-scheme` media query on first load if no preference is saved.
- **FR-006:** All navigation elements, including sidebar toggles and dropdowns, MUST be fully navigable via keyboard (Tab/Enter/Arrow keys) and display visible focus rings (WCAG 2.1 AA).

#### Dashboard (US-1)
- **FR-007:** Dashboard MUST initialize by fetching summary metrics in parallel; failure of one metric API call MUST NOT block the rendering of others (Partial Failure Handling).
- **FR-008:** Dashboard MUST display "Stat Cards" for:
  - **Pages:** Total count split by Published vs. Draft.
  - **Gallery:** Total count split by Published vs. Draft.
  - **Submissions:** Total count + Count received "Today".
  - **Redirects:** Total count split by Active vs. Inactive.

* **FR-009:** Dashboard MUST render a bar chart visualizing submission volume for the rolling 7-day window (Today + previous 6 days).
* ==**FR-010:** Dashboard MUST render an "Activity Feed" showing the 5 most recent entries from the Audit Log, formatting timestamps relative to the user's current time (e.g., "2 hours ago"). And display in hours when less than 24 hours, else use "day"; display in "day" when less than 72 hours, else use "days"; display number of "years" + "month" when above 365 "days" and if "years" is less than 2 use "year".==

#### Shared Data Table Components (US-3, US-5, US-6)
- **FR-011:** All list views MUST implement server-side pagination. The UI MUST display "Page X of Y" and provide "Next/Previous" controls that are disabled when at the bounds of the dataset.
- **FR-012:** Column headers MUST be clickable to toggle sort order: `None` -> `ASC` -> `DESC` -> `None`.

* **FR-013:** Search inputs MUST implement a 300ms debounce before triggering an API request to prevent request flooding.
* **FR-014**: Data tables MUST display loading skeleton states during data fetches.

- **FR-015**: Data tables MUST support pagination with configurable page sizes (10, 20, 50, 100).
- **FR-016**: Data tables MUST support multi-row selection with checkbox column and bulk actions toolbar.
- **FR-017**: Data tables MUST display empty state with illustration when no data matches filters.
- **FR-018**: Data table MUST display an illustration and "Clear Filters" button if filters are active.

#### Page Editor
- **FR-015**: Page editor MUST display two-column layout: content fields on left, SEO/settings sidebar on right.
- **FR-016**: Page editor MUST support drag-and-drop reordering of page sections.
- **FR-017**: Page editor MUST auto-save changes with 3-second debounce and display save status indicator.
- **FR-018**: Page editor MUST warn users before navigating away with unsaved changes.
- **FR-019**: Page editor MUST provide preview functionality that opens current page state in new browser tab.
- **FR-020**: Page editor MUST include an image manager for selecting/uploading hero images.

#### Gallery Management
- **FR-021**: Gallery MUST support grid view (thumbnail cards) and list view (table) with toggle.
- **FR-022**: Gallery MUST support filtering by category (Garden Room, House Extension) and status (Draft, Published).
- **FR-023**: Gallery MUST support bulk operations: Publish, Delete, Change Category for selected items.
- **FR-024**: Gallery MUST support drag-and-drop image upload with progress indication.

#### Submissions
- **FR-025**: Submissions MUST support filtering by date range and source page.
- **FR-026**: Submissions MUST display expandable row detail showing full form data and metadata.
- **FR-027**: Submissions MUST support CSV export of filtered data.

#### Authentication & Security
- **FR-028**: System MUST support JWT access tokens (1 hour expiry) stored in memory.
- **FR-029**: System MUST support refresh tokens (7 day expiry) stored in httpOnly cookie.
- **FR-030**: System MUST implement idle timeout (30 minutes) with warning at 25 minutes.
- **FR-031**: System MUST implement account lockout after 5 failed login attempts.
- **FR-032**: System MUST implement role-based access control with three roles: Admin (full access), Editor (content only), Viewer (read-only).
- **FR-033**: System MUST log all admin actions to an audit log with user, action, entity, timestamp, and IP.

#### Theme & Accessibility
- **FR-034**: System MUST support light and dark theme modes with user preference persistence.
- **FR-035**: System MUST meet WCAG 2.1 AA accessibility standards including keyboard navigation, ARIA labels, and color contrast ratios.
- **FR-036**: All interactive elements MUST be focusable and operable via keyboard.
- **FR-037**: System MUST display loading states with ARIA live regions for screen reader announcements.

#### Error Handling
- **FR-038**: System MUST implement error boundaries to prevent full-page crashes from component errors.
- **FR-039**: System MUST display toast notifications for success, error, warning, and info messages.

"Layout & Navigation", "Dashboard", "Data Tables", "Page Editor", "Gallery Management", "Submissions", "Authentication & Security", "Error Handling"

### Key Entities

- **User**: Represents an admin user with id, email, passwordHash, roles array, and login timestamps. Related to AuditLog entries.
- **AuditLog**: Records admin actions with userId, action type, entity type, entityId, changes (JSON), IP address, user agent, and timestamp.
- **Setting**: Key-value configuration store for site-wide settings (site name, default SEO, notification preferences).
- **RefreshToken**: Tracks active refresh tokens with userId, token family (for rotation), expiry, and revocation status.
- **Page**: Content pages with title, slug, hero content, sections (JSON), SEO metadata. Related to GalleryItem for hero images.
- **GalleryItem**: Image assets with title, caption, category, URL, alt text, publish status. Can be referenced by Pages.
- **Submission**: Form submissions with payload (JSON), source page, consent info, timestamps.
- **Redirect**: URL redirects with source slug, destination URL, active status.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin users can navigate to any section from any page within 2 clicks using the sidebar.
- **SC-002**: Dashboard page loads and displays all widgets within 2 seconds on standard broadband connection.
- **SC-003**: Data tables with up to 1000 records sort and filter with perceived response time under 500ms.
- **SC-004**: Page auto-save completes within 1 second of edit pause, with visual confirmation shown to user.
- **SC-005**: 100% of interactive elements are keyboard-accessible (can be focused and activated without mouse).
- **SC-006**: All text meets WCAG 2.1 AA contrast ratio requirements (4.5:1 for normal text, 3:1 for large text).
- **SC-007**: Theme switching applies to all UI elements without page reload or visual glitches.
- **SC-008**: Session timeout warning appears exactly 5 minutes before expiry; logout occurs at exactly 30 minutes idle.
- **SC-009**: Admin users report improved efficiency compared to current interface in user testing (target: 30% faster task completion for common workflows).
- **SC-010**: Zero critical accessibility issues found in automated and manual accessibility audit.

---

## Assumptions

- The existing API authentication (JWT-based) will be extended rather than replaced.
- The existing Prisma schema will be extended with new models (AuditLog, Setting, RefreshToken) without breaking changes.
- The `@modular-house/ui` package will be extended with admin-specific components.
- Browser support targets: Latest 2 versions of Chrome, Firefox, Safari, Edge.
- Mobile admin access is "responsive but not optimized" - full functionality available but complex tasks expected on desktop.
- Initial RBAC implementation will have the three roles defined; granular permissions can be added later.

---

## Out of Scope

- Advanced content versioning / revision history (future enhancement)
- Multi-language / internationalization support
- Real-time collaborative editing (multiple admins editing same page)
- Custom dashboard widget configuration
- API documentation portal within admin
- Automated backup management UI
- Customer/lead management CRM features beyond submission viewing
