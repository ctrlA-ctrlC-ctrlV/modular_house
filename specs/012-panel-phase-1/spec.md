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

1. **Given** a registered, active admin account, **When** the administrator submits the correct email and password, **Then** the system emails a short-lived one-time code to the account address and presents a code-entry step instead of granting immediate access.
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

---

### User Story 4 - Manage my own account on the settings page (Priority: P3)

A signed-in administrator opens their user settings page to change their password (entered twice, must match and meet policy, confirmed with their current password) and to update their profile photo. Their name and email are visible but read-only in Phase 1.

**Why this priority**: Account self-management is valuable once sign-in works, but it is not required to demonstrate secure access, so it follows the core flows.

**Independent Test**: As an authenticated user, change the password via the settings page (matching entries) and confirm the new password works on next sign-in; upload a new profile photo and confirm it is shown; confirm name and email are displayed read-only; confirm the super_admin account is read-only.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the settings page, **When** they enter a new password twice with matching values meeting the policy and confirm with the correct current password, **Then** the password is updated and usable on the next sign-in.
2. **Given** the settings page, **When** the two new-password entries differ or fail the policy, or the current password is wrong, **Then** the change is rejected with a clear message and no update occurs.
3. **Given** the settings page, **When** the user uploads a new profile photo, **Then** the photo is saved and displayed in the settings page and the sidebar user section.
4. **Given** the settings page, **When** the user views their name and email, **Then** both are shown as read-only and cannot be edited in Phase 1.
5. **Given** the super_admin account is signed in, **When** it opens settings, **Then** its account is displayed read-only and cannot be changed through the panel (changes are made only via direct database access).

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

#### Admin shell

- **FR-019**: The shell MUST provide a collapsible left sidebar and a top bar that are reused across every admin view.
- **FR-020**: In Phase 1, the sidebar's main content-navigation area MUST display a centered, faded "Coming Soon" message and MUST NOT expose feature pages.
- **FR-021**: The sidebar MUST include a user section pinned to its bottom (avatar, name, account menu) consistent with the template.
- **FR-022**: The top bar MUST provide a sidebar-collapse toggle, a UI-preference control, a dark-mode toggle, and an account button, and MUST NOT include a GitHub link or button.
- **FR-023**: Sidebar collapse state and theme selection MUST persist across reloads and sessions and MUST be applied before first paint to avoid any visual flash.

#### Theming & accessibility

- **FR-024**: System MUST support light and dark modes using the design-system tokens.
- **FR-025**: System MUST ship the Default preset and a single font in Phase 1, while keeping the token structure extensible so additional presets/fonts can be added later without reworking components (Open-Closed Principle).
- **FR-026**: The admin UI MUST meet WCAG 2.1 AA (including color contrast and visible focus indicators) and MUST be fully operable by keyboard, including a keyboard shortcut to toggle the sidebar.

#### User settings

- **FR-027**: An authenticated user MUST be able to change their password from a settings page by entering the new password twice (both must match and meet the password policy) and confirming with their current password.
- **FR-028**: A user MUST be able to change their profile photo, with invalid file types or oversized images rejected with a clear message.
- **FR-029**: The settings page MUST display the user's name and email as read-only in Phase 1.
- **FR-030**: The super_admin account MUST be shown read-only in the panel and changeable only via direct database access, while retaining unrestricted access.

#### Access control, audit & session integrity

- **FR-031**: The authenticated session MUST carry the user's role and effective permissions so later phases can gate features through permission checks without modifying route code (reusing the existing role/permission model).
- **FR-032**: System MUST record authentication-related events (login success and failure, logout, one-time-code issuance and verification, password-reset request and completion) in the existing audit log.
- **FR-033**: Logout MUST end the active session and invalidate the associated session/refresh credential so it cannot be reused.
- **FR-034**: Secrets — passwords, one-time codes, and reset tokens — MUST be stored only in hashed/secure form and MUST never be written to logs or returned to the client in raw form.
- **FR-035**: Session credentials MUST be stored and transmitted using secure, industry-standard practices that minimize exposure to client-side theft (e.g., avoiding long-lived secrets in browser-accessible storage where avoidable).

### Key Entities *(include if feature involves data)*

- **Admin User**: An account that can sign in to the panel. Key attributes: email, securely hashed password, assigned role, active flag, failed-attempt count and lockout window, last sign-in time, display name, and profile photo reference. (Existing model extended with display name and profile photo.)
- **Role & Permission**: Named roles mapped to granular permissions, used to express what a signed-in user may do. (Existing; reused unchanged in Phase 1 to carry permissions in the session.)
- **One-Time Login Code**: A short-lived two-factor code tied to a user. Key attributes: owning user, hashed code value, expiry time, incorrect-attempt count, consumed flag.
- **Password Reset Token**: A single-use recovery token tied to a user. Key attributes: owning user, hashed token value, expiry time, consumed flag.
- **Session / Refresh Credential**: Represents an authenticated session and its renewal, supporting rotation and revocation on logout. (Existing model reused.)
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

## Assumptions

- **Reused backend models (feature 006)**: User, Role, Permission, RolePermission, RefreshToken (with rotation), and AuditLog already exist and are wired up rather than rebuilt. Phase 1 adds only the minimal new structures needed for the one-time login code, the password-reset token, and the user's display name and profile photo.
- **Two-factor on every sign-in**: A one-time code is required on each successful password verification. No "trusted device" / 2FA-skipping behavior is included in Phase 1; any "remember me" affordance, if kept, only affects session length and never bypasses two-factor.
- **Email delivery**: Both the one-time code and the reset link are delivered through the existing SMTP mail service; no new email provider, vendor, or authenticator-app method is introduced.
- **Session strategy**: Phase 1 adopts the existing refresh-token rotation model and secure session handling rather than the legacy long-lived token-in-local-storage approach; exact storage mechanics are an implementation concern bounded by FR-035.
- **Code/link lifetimes (defaults, tunable)**: One-time codes expire in roughly 10 minutes; reset links expire in roughly 30–60 minutes. Final values are set during implementation without changing the requirements.
- **Profile photo storage**: Profile photos are stored consistently with the project's database-backed media direction; a local backup/seed path is acceptable. Full image-library migration is Phase 2 and out of scope here.
- **Theme scope**: Only the Default preset plus light/dark and a single font ship in Phase 1; the token system remains extensible for future presets/fonts.
- **Landing view**: After sign-in, the administrator lands on the shell showing the "Coming Soon" content area; no dashboard widgets or feature pages are part of Phase 1.
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
