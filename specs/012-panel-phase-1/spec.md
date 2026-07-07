# Feature Specification: Admin Panel — Phase 1: Foundation (UI & Access)

**Feature Branch**: `012-panel-phase-1`
**Created**: 2026-06-18
**Status**: Draft
**Input**: User description: "Create spec for phase 1 of the admin panel implementation plan using BDD. Port the Studio Admin template design system into the existing React/Vite app, rebuild the login (template 'login v1' without Google sign-in, registration replaced by password reset), stand up the admin app shell (collapsible sidebar with a faded 'Coming Soon' content area and a bottom user section; top bar with sidebar-collapse, UI-preference, dark-mode, and account controls; no GitHub button), wire authentication and access control against the database, add email-based two-factor authentication and password reset, and provide a user settings page (password change, profile photo, read-only name and email)."

## Clarifications

### Session 2026-06-18

- Reference design source: Studio Admin template at `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`, with its design system documented under `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard\.doc\design`. The full Phase plan lives at `.docs/new-admin-panel-design-brief.md`.
- This specification covers **Phase 1 only**. Phases 2–4 (content/media migration, user/role management, customer tracking) are out of scope here and are referenced only as forward-compatibility constraints.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in securely with email two-factor authentication (Priority: P1)

An administrator opens the admin login page, enters the email and password held in the account database, and is then prompted for a one-time code that has just been emailed to their account address. After entering the correct code they reach the admin panel. This is the security gate that protects every other admin capability.

**Why this priority**: Without a working, database-backed, two-factor sign-in there is no safe entry point to the admin panel and no other Phase 1 capability can be demonstrated. It is the minimum shippable slice.

**Independent Test**: Seed an admin account in the database, attempt sign-in with correct and incorrect credentials, confirm a one-time code email is delivered, and verify that only the correct, unexpired code grants access.

**Acceptance Scenarios**:

1. **Given** a registered, active admin account, **When** the administrator submits the correct email and password, **Then** the system emails a short-lived one-time code to the account email address and presents a code-entry step instead of granting immediate access.
2. **Given** the code-entry step is shown, **When** the administrator enters the correct, unexpired code, **Then** an authenticated admin session is established and the admin panel loads.
3. **Given** the code-entry step is shown, **When** the administrator enters an incorrect code, **Then** access is denied, the failure is counted, and a clear retry message is shown.
4. **Given** a one-time code has expired, **When** the administrator submits it, **Then** access is denied and the administrator can request a new code (subject to rate limiting).
5. **Given** an unknown email or wrong password is submitted, **When** the form is sent, **Then** the system shows a single generic "invalid credentials" message that does not reveal whether the email exists.
6. **Given** repeated failed password attempts on one account, **When** the configured threshold is exceeded, **Then** the account is temporarily locked and a corresponding message is shown.

---

### User Story 2 - Work inside the redesigned admin shell (Priority: P2)

After signing in, the administrator sees the new admin panel shell: a collapsible left sidebar whose main content navigation shows a faded "Coming Soon" message (Phase 1 has no feature pages yet) and a user section pinned to the bottom, plus a top bar offering sidebar collapse, UI-preference control, a dark-mode toggle, and an account button. The experience visually matches the Studio Admin template, supports light and dark themes, and is fully keyboard operable.

**Why this priority**: The shell is the reusable foundation every later phase renders into. Delivering it proves the design-system port and the navigation chrome independently of feature content.

**Independent Test**: With an authenticated session, load the panel and confirm the sidebar, "Coming Soon" content area, bottom user section, and top-bar controls render per the template, that dark mode and sidebar collapse work and persist, and that the whole shell is reachable by keyboard.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** the admin panel loads, **Then** a collapsible left sidebar and a top bar are shown, matching the template's layout, spacing, radius, and tokens.
2. **Given** the panel is open in Phase 1, **When** the administrator looks at the main content area, **Then** a centered, faded "Coming Soon" message is displayed and no feature pages are present.
3. **Given** the sidebar is shown, **When** the administrator looks at its lower region, **Then** a user section (avatar, name, account menu) is pinned to the bottom per the template.
4. **Given** the top bar is shown, **When** the administrator inspects its controls, **Then** it provides a sidebar-collapse toggle, a UI-preference control, a dark-mode toggle, and an account button, and it does NOT include a GitHub link or button.
5. **Given** the administrator toggles the sidebar collapse or dark mode, **When** they reload the page or return in a later session, **Then** the previously chosen state is restored without a visible flash on first paint.
6. **Given** a keyboard-only user, **When** they navigate the shell, **Then** every control is reachable and operable, focus is clearly visible, and a keyboard shortcut toggles the sidebar.
7. **Given** an authenticated session, **When** the administrator activates the account button (or the sidebar user section), **Then** an account menu opens offering at least "Settings" and "Logout".
8. **Given** the account menu is open, **When** the administrator selects "Logout", **Then** the active session is ended, its session/refresh credential is invalidated, and the user is returned to the login screen; navigating back or reusing the prior credential does not restore access.
9. **Given** a small-viewport (mobile) device, **When** the administrator opens the panel, **Then** the shell presents a touch-first, mobile-optimized layout — the sidebar collapses to an off-canvas drawer, the top-bar controls remain reachable, and content fits without horizontal scrolling.

---

### User Story 3 - Reset a forgotten password from the login page (Priority: P2)

An administrator who has forgotten their password chooses the password-reset option on the login page, enters their email, and receives a single-use reset link. Following the link, they set a new password by entering it twice; the change only succeeds when both entries match and satisfy the password policy.

**Why this priority**: Self-service recovery is essential the moment database-backed credentials exist, otherwise a forgotten password locks an administrator out permanently. It is independent of, but complementary to, the sign-in flow.

**Independent Test**: Request a reset for a known and an unknown email, confirm an identical confirmation message in both cases, follow a valid link to set a matching new password, and verify the old password no longer works while a reused/expired link is rejected.

**Acceptance Scenarios**:

1. **Given** the login page, **When** the administrator selects the password-reset option and submits a registered email, **Then** a single-use, time-limited reset link is emailed to that address.
2. **Given** an unregistered email is submitted, **When** the request is sent, **Then** the same neutral confirmation message is shown and no email is sent, so account existence is not revealed.
3. **Given** a valid, unexpired reset link, **When** the administrator enters a new password twice with matching values that meet the policy, **Then** the password is updated and a success confirmation is shown.
4. **Given** a reset page, **When** the two password entries do not match or fail the policy, **Then** the submission is rejected with a clear, specific message and no change is made.
5. **Given** a reset link that has already been used or has expired, **When** the administrator opens it, **Then** the system shows a clear error and offers a path to request a new link.
6. **Given** a password has been reset, **When** the administrator signs in, **Then** the new password works and the previous password is rejected.
7. **Given** the account had other active sessions before the reset, **When** the reset completes, **Then** those other sessions are revoked and must re-authenticate.

---

### User Story 4 - Manage my own account on the settings page (Priority: P3)

A signed-in administrator opens their user settings page to change their password (entered twice, must match and meet policy, confirmed with their current password) and to update their profile photo. Their personal information such as name and email are visible but read-only in Phase 1.

**Why this priority**: Account self-management is valuable once sign-in works, but it is not required to demonstrate secure access, so it follows the core flows.

**Independent Test**: As an authenticated user, change the password via the settings page (matching entries) and confirm the new password works on next sign-in; upload a new profile photo and confirm it is shown; confirm name and email are displayed read-only; confirm the super_admin account is read-only.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the settings page, **When** they enter a new password twice with matching values meeting the policy and confirm with the correct current password, **Then** the password is updated and usable on the next sign-in.
2. **Given** the user changes their password from the settings page, **When** the change succeeds, **Then** the account's other active sessions are revoked and only the current session remains valid.
3. **Given** the settings page, **When** the two new-password entries differ or fail the policy, or the current password is wrong, **Then** the change is rejected with a clear message and no update occurs.
4. **Given** the settings page, **When** the user uploads a new profile photo, **Then** the photo is saved and displayed in the settings page and the sidebar user section.
5. **Given** the user has a custom profile photo, **When** they remove it without uploading a replacement, **Then** the display falls back to a default (user initials) in both the settings page and the sidebar user section.
6. **Given** the settings page, **When** the user views their personal information (name and email), **Then** everything is shown as read-only and cannot be edited in Phase 1.
7. **Given** the super_admin account is signed in, **When** it opens settings, **Then** its account is displayed read-only and cannot be changed through the panel (changes are made only via direct database access).
8. **Given** an authenticated session, **When** the user opens the account menu and selects "Settings", **Then** the user settings page loads; the settings page is not reachable without an authenticated session.

---

### Edge Cases

- **Email delivery delay or failure for 2FA/reset**: If the one-time code or reset email cannot be sent, the system surfaces a clear, non-technical error and lets the user retry; no session is granted without a verified code.
- **Code/link request flooding**: Repeated requests for one-time codes or reset links are rate-limited per account to prevent inbox flooding and abuse.
- **Concurrent codes**: Requesting a new one-time code invalidates the prior unexpired code so only the latest code is accepted.
- **Inactive or deactivated account**: A deactivated account cannot complete sign-in even with correct credentials and a valid code.
- **Locked account during reset**: A successful password reset clears the failed-attempt lockout so the user can sign in immediately afterward.
- **Theme flash on first paint**: The persisted theme and sidebar state are applied before the first paint so the panel never flashes the wrong theme.
- **Session expiry mid-use**: When the session ends or is revoked, protected admin views redirect to the login page rather than showing broken or empty content.
- **Public site isolation**: Adding the admin panel must not change or regress any public marketing page.
- **Oversized or invalid profile photo**: An unsupported file type or oversized image is rejected with a clear message and no change is made.
- **Credential change while signed in elsewhere**: A password change or reset revokes the account's other active sessions, so a stolen or stale session cannot outlive a credential change.
- **Concurrent sessions across devices**: An account may hold more than one active session at a time; a plain logout ends only the current session, whereas a password change/reset performs account-wide revocation.

## Requirements *(mandatory)*

### Functional Requirements

#### Removal & foundation

- **FR-001**: System MUST remove the previous admin panel implementation (legacy login, dashboard, and associated styling/routes) so no legacy admin UI remains reachable.
- **FR-002**: The admin panel MUST be presented as an authenticated-only section whose visual design (color tokens, primitives, spacing, radius, typography) matches the referenced Studio Admin design system.
- **FR-003**: All admin views MUST be reachable only after successful authentication; unauthenticated access MUST redirect to the login screen.
- **FR-004**: The design-system layer MUST be kept separate from the public marketing component library so the public site is unaffected (loose coupling / no regression).

#### Login screen

- **FR-005**: The login screen MUST follow the template's "login v1" layout, excluding any third-party ("Continue with Google") sign-in option.
- **FR-006**: The login screen MUST replace the account-registration entry point with a password-reset ("Forgot password") entry point.
- **FR-007**: System MUST authenticate using account credentials stored in the database (email plus securely hashed password) and MUST NOT rely on any hardcoded credentials.
- **FR-008**: System MUST return a single generic error for invalid credentials that does not reveal whether the email exists.
- **FR-009**: System MUST enforce temporary account lockout after a configurable number of consecutive failed password attempts and communicate the lockout to the user.

#### Two-factor authentication

- **FR-010**: On every successful password verification, system MUST generate a short-lived one-time code, store it only in hashed form, and email it to the account's address using the existing mail service.
- **FR-011**: System MUST establish an authenticated admin session only after a correct, unexpired one-time code is submitted.
- **FR-012**: One-time codes MUST expire after a bounded time window, become invalid after a single successful use, and lock out after a bounded number of incorrect attempts.
- **FR-013**: System MUST allow the user to request a new one-time code when the previous code has expired, subject to per-account rate limiting, invalidating any prior unexpired code.

#### Password reset

- **FR-014**: From the login screen, a user MUST be able to request a password reset by submitting their email address.
- **FR-015**: System MUST email a single-use, time-limited reset link only when the account exists, while always presenting the same neutral confirmation message regardless of whether the account exists.
- **FR-016**: The reset page MUST require the new password to be entered twice and MUST reject the change unless both entries match and satisfy the password policy.
- **FR-017**: A reset link MUST be invalidated after a successful reset or after expiry, and opening a consumed or expired link MUST show a clear error with a path to request a new one.
- **FR-018**: A successful password reset MUST clear any active failed-attempt lockout for that account.

#### Password policy

- **FR-019**: System MUST define a single password policy and enforce it identically wherever a password is set (reset link and settings-page change). The policy MUST specify a minimum length and basic strength rules, reject the user's current password as the new value, and surface a clear, specific message on any violation. Exact thresholds are tunable defaults (see Assumptions) and MUST be applied server-side, not only in the browser.

#### Admin shell

- **FR-020**: The shell MUST provide a collapsible left sidebar and a top bar that are reused across every admin view.
- **FR-021**: In Phase 1, the sidebar's main content-navigation area MUST display a centered, faded "Coming Soon" message and MUST NOT expose feature pages.
- **FR-022**: The sidebar MUST include a user section pinned to its bottom (avatar, name, account menu) consistent with the template.
- **FR-023**: The top bar MUST provide a sidebar-collapse toggle, a UI-preference control, a dark-mode toggle, and an account button, and MUST NOT include a GitHub link or button.
- **FR-024**: Sidebar collapse state and theme selection MUST persist across reloads and sessions and MUST be applied before first paint to avoid any visual flash.
- **FR-025**: The account control (top-bar account button and/or sidebar user section) MUST open an account menu that provides, at minimum, navigation to the user settings page and a logout action. The settings page MUST be reachable only from within an authenticated session.
- **FR-026**: The shell MUST remain usable across the reference template's supported breakpoints, preserving the template's responsive/off-canvas sidebar behavior on narrow viewports. 
- **FR-027**: The admin panel MUST provide a mobile-optimized experience for small viewports across all Phase 1 surfaces (login, two-factor entry, password reset, shell, and user settings), designed for touch and narrow screens rather than a scaled-down desktop layout. The mobile design MUST be captured in a dedicated mobile design document maintained alongside the template design references.

#### Theming & accessibility

- **FR-028**: System MUST support light and dark modes using the template's design-system tokens; adapting the template's theme (tokens, light/dark, and the Default theme) into the admin panel is Phase 1 work and is not deferred.
- **FR-029**: System MUST ship the Default preset and a single font in Phase 1, while keeping the token structure extensible so additional presets/fonts can be added later without reworking components (Open-Closed Principle).
- **FR-030**: The admin UI MUST meet WCAG 2.1 AA (including color contrast and visible focus indicators) and MUST be fully operable by keyboard, including a keyboard shortcut to toggle the sidebar.
- **FR-031**: The pre-authentication pages — login, two-factor code entry, and password reset — MUST also meet WCAG 2.1 AA and be fully keyboard-operable, with form fields, errors, and the code-entry step exposed to assistive technology.

#### User settings

- **FR-032**: An authenticated user MUST be able to change their password from a settings page by entering the new password twice (both must match and meet the password policy) and confirming with their current password.
- **FR-033**: A user MUST be able to change their profile photo, with invalid file types or oversized images rejected with a clear message.
- **FR-034**: The settings page MUST display the user's name and email as read-only in Phase 1.
- **FR-035**: The super_admin account MUST be shown read-only in the panel and changeable only via direct database access, while retaining unrestricted access.

#### Access control, audit & session integrity

- **FR-036**: The authenticated session MUST carry the user's role and effective permissions so later phases can gate features through permission checks without modifying route code (reusing the existing role/permission model).
- **FR-037**: System MUST record authentication-related events (login success and failure, logout, one-time-code issuance and verification, password-reset request and completion, and settings-page password change) in the existing audit log.
- **FR-038**: Logout MUST end the active session and invalidate the associated session/refresh credential so it cannot be reused.
- **FR-039**: Secrets — passwords, one-time codes, and reset tokens — MUST be stored only in hashed/secure form and MUST never be written to logs or returned to the client in raw form.
- **FR-040**: Session credentials MUST be stored and transmitted using secure, industry-standard practices that minimize exposure to client-side theft (e.g., avoiding long-lived secrets in browser-accessible storage where avoidable).
- **FR-041**: A password change (settings page) or password reset (reset link) MUST revoke the account's other active sessions/refresh credentials, requiring them to re-authenticate, while leaving the session that performed a settings-page change valid.

#### Abuse prevention & request throttling

- **FR-042**: For both one-time codes (FR-010–FR-013) and password-reset links (FR-014–FR-015), after a request the system MUST enforce a minimum resend cooldown (default ~60 seconds) before the same user can request another, and the UI MUST indicate when a new request becomes available (e.g., a countdown on the resend control). A request made during the cooldown MUST NOT issue or email a new code/link.
- **FR-043**: Beyond the per-request cooldown, the system MUST cap the number of one-time-code and reset-link requests per account/email within a rolling time window (tunable defaults). Exceeding the cap MUST temporarily block further requests and show a clear, non-technical message; the throttling response MUST remain neutral so it never reveals whether an email is registered (preserving FR-008 and FR-015).

### Key Entities *(include if feature involves data)*

- **Admin User**: An account that can sign in to the panel. Key attributes: email, securely hashed password, assigned role, active flag, failed-attempt count and lockout window, last sign-in time, display name, and profile photo reference (optional; when absent, a default avatar/initials is shown). (Existing model extended with display name and profile photo.)
- **Role & Permission**: Named roles mapped to granular permissions, used to express what a signed-in user may do. (Existing; reused unchanged in Phase 1 to carry permissions in the session.)
- **One-Time Login Code**: A short-lived two-factor code tied to a user. Key attributes: owning user, hashed code value, expiry time, incorrect-attempt count, consumed flag.
- **Password Reset Token**: A single-use recovery token tied to a user. Key attributes: owning user, hashed token value, expiry time, consumed flag.
- **Session / Refresh Credential**: Represents an authenticated session and its renewal, supporting rotation and revocation on logout and on password change/reset (account-wide). (Existing model reused.)
- **Audit Log Entry**: An immutable record of an admin/security action. Key attributes: acting user, action, affected entity, timestamp, request metadata. (Existing model reused.)
- **User Preferences**: Per-user interface choices persisted across sessions — at minimum theme mode (light/dark/system) and sidebar collapse state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of admin sign-ins authenticate against database-stored credentials; no hardcoded login path remains anywhere in the admin panel.
- **SC-002**: In a verified delivery test, the two-factor one-time code email arrives within 30 seconds for at least 9 of 10 sends, and no session is ever granted without a correct, unexpired code.
- **SC-003**: An administrator can complete the forgotten-password recovery flow end to end (request link, set matching new password, sign in) in under 3 minutes.
- **SC-004**: A design review confirms the Phase 1 login and shell match the Studio Admin reference, with at least 90% of the agreed visual-parity checklist items passing.
- **SC-005**: The admin UI passes WCAG 2.1 AA checks with zero critical accessibility violations and is fully operable by keyboard, including sidebar toggle.
- **SC-006**: Theme selection and sidebar state are restored on reload with no measurable theme flash (no wrong-theme frame on first paint).
- **SC-007**: The legacy admin panel is fully removed — no legacy admin route or screen is reachable after Phase 1 ships.
- **SC-008**: The public marketing site shows zero regressions (all existing public-site checks pass) after the admin panel is added.
- **SC-009**: Automated tests covering sign-in, two-factor verification, password reset, account lockout, and shell behavior all pass in the continuous-integration pipeline.
- **SC-010**: From the settings page, a user can change their password (and use it on next sign-in) and replace their profile photo (reflected in the sidebar user section) end to end, while name and email remain read-only.
- **SC-011**: After a password change or reset, the account's other active sessions are verifiably revoked and forced to re-authenticate.
- **SC-012**: On a representative small-viewport device, every Phase 1 surface (login, two-factor entry, password reset, shell, and settings) is usable touch-first — controls reachable, no horizontal scrolling, sidebar presented as an off-canvas drawer — and a mobile design document covering these layouts exists.

## Assumptions

- **Reused backend models (feature 006)**: User, Role, Permission, RolePermission, RefreshToken (with rotation), and AuditLog already exist and are wired up rather than rebuilt. Phase 1 adds only the minimal new structures needed for the one-time login code, the password-reset token, and the user's display name and profile photo.
- **Two-factor on every sign-in**: A one-time code is required on each successful password verification. No "trusted device" / 2FA-skipping behavior is included in Phase 1; any "remember me" affordance, if kept, only affects session length and never bypasses two-factor.
- **Email delivery**: Both the one-time code and the reset link are delivered through the existing SMTP mail service; no new email provider, vendor, or authenticator-app method is introduced.
- **Session strategy**: Phase 1 adopts the existing refresh-token rotation model and secure session handling rather than the legacy long-lived token-in-local-storage approach; exact storage mechanics are an implementation concern bounded by FR-035.
- **Code/link lifetimes (defaults, tunable)**: One-time codes expire in roughly 10 minutes; reset links expire in roughly 30–60 minutes. Final values are set during implementation without changing the requirements.
- **Profile photo storage**: Profile photos are stored consistently with the project's database-backed media direction; a local backup/seed path is acceptable. Full image-library migration is Phase 2 and out of scope here.
- **Theme scope**: The template's theming is adapted into the admin panel in Phase 1 — design tokens, light/dark, and the Default theme (FR-028). Only the Default preset plus a single font ship now; the token system stays extensible so future presets/fonts can be added without reworking components.
- **Mobile design**: Mobile-specific layouts are in scope for Phase 1 across all surfaces and are captured in a dedicated mobile design document, kept alongside the Studio Admin references so later phases inherit consistent mobile patterns (FR-027).
- **Landing view**: After sign-in, the administrator lands on the shell showing the "Coming Soon" content area; no dashboard widgets or feature pages are part of Phase 1.
- **Password policy (defaults, tunable)**: Minimum length around 12 characters with basic strength checks (e.g., not a common/breached password, not equal to the current password). Enforced server-side and applied identically at reset and at change (FR-019). Final thresholds are set during implementation without changing the requirement.
- **One-time-code format (defaults, tunable)**: A 6-digit numeric code, single-use, expiring in roughly 10 minutes, locked out after a small number of incorrect attempts. Format and limits are tunable without changing FR-010–FR-013.
- **Profile-photo constraints (defaults, tunable)**: Common web image types (e.g., PNG, JPEG, WebP) up to a modest size cap (e.g., ~5 MB); the server validates type and size and may downscale. Storage follows the project's database-backed media direction (see Profile photo storage above).
- **Session lifetimes (defaults, tunable)**: A short-lived access credential refreshed via rotation, an idle timeout, and an absolute session cap. Any "remember me" affordance only lengthens the refresh lifetime and never bypasses two-factor (consistent with FR-040 and the two-factor assumption).
- **Account bootstrapping**: Because registration is removed and user-management UI is Phase 3, the initial admin/super_admin account(s) are created by direct database seeding in Phase 1.
- **UI-preference control scope**: In Phase 1 the top-bar UI-preference control exposes only theme mode and the single shipped Default preset/font; it is structured to accept future presets/fonts without rework (bounded by FR-028/FR-029) but adds none now.
- **UI language**: The admin UI ships in a single language (English) in Phase 1; multi-language content remains in the parking lot.
- **No emoji in code**, conventional naming, and Open-Closed-friendly extension points are followed throughout per the senior-engineering requirements in the brief.

## Dependencies

- Existing authentication, RBAC (role/permission), refresh-token rotation, account-lockout, and audit-log models from feature 006.
- The existing SMTP mail service for transactional email (one-time codes and reset links).
- The Studio Admin template and its design documentation as the visual and structural reference for the login screen and shell.

## Out of Scope (Phase 1)

- Content and media migration to the database and the page/product/image editing interfaces (Phase 2).
- User and role management screens (Phase 3) — Phase 1 only wires the access-control plumbing, not the management UI.
- Customer CRUD, online-submission management, and progress/payment tracking (Phase 4).
- Additional theme presets beyond Default and additional fonts beyond the single shipped font.
- Audit-log/system-log viewer UI, job/kanban management, website performance tracking, and multi-language content (parking lot).
- Editing the super_admin account through the panel (database-only).
