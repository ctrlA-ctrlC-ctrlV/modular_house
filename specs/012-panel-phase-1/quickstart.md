# Phase 1 Quickstart: Admin Panel — Phase 1 (UI & Access)

**Feature**: `012-panel-phase-1` | **Date**: 2026-06-23

This document is the developer entry point for Phase 1: how to run it, how to verify each user
story, and the FR -> test traceability table that satisfies Definition of Done (DoD-2).

---

## 1. Prerequisites

- Node + pnpm (monorepo: `apps/web`, `apps/api`).
- PostgreSQL reachable via `DATABASE_URL`.
- SMTP configured (`MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`) for the OTP and
  reset emails (reuses the existing `MailerService`).
- Auth secrets in env: `JWT_SECRET`, `JWT_EXPIRES_IN=15m`, `REFRESH_TOKEN_SECRET`,
  `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD`.

## 2. Setup

```powershell
pnpm install
# apply the new migration (adds login_codes, password_reset_tokens, user_preferences; extends users)
pnpm --filter @modular-house/api db:migrate
# seed roles, permissions, and the bootstrap super_admin/admin (now with displayName)
pnpm --filter @modular-house/api db:seed
```

## 3. Run

```powershell
pnpm --filter @modular-house/api dev      # API on its configured port
pnpm --filter @modular-house/web dev      # Vite dev server; admin under /admin
```

## 4. Verify each user story (manual smoke)

### US1 — Secure sign-in with email 2FA
1. Go to `/admin/login`, enter the seeded admin email + password -> redirected to the code-entry step
   (no session yet). An email with a 6-digit code arrives within ~30s.
2. Enter the correct code -> the admin shell loads ("Coming Soon" content).
3. Enter a wrong code 5 times -> code invalidated; request a new one.
4. Enter a wrong password 5 times -> account temporarily locked (15m).
5. Unknown email and wrong password show the same generic message.

### US2 — Admin shell
1. Confirm: collapsible sidebar, 48px top bar (collapse, UI-preference, dark-mode, account), NO
   GitHub button, centered faded "Coming Soon", bottom user section.
2. Toggle dark mode + collapse, reload -> state restored with no theme flash.
3. Keyboard-only: tab through everything, focus visible, Ctrl/Cmd+B toggles the sidebar.
4. Account menu -> Logout returns to login; back-nav does not restore access.
5. Narrow viewport (<768px): sidebar becomes an off-canvas drawer; no horizontal scroll.

### US3 — Password reset
1. `/admin/login` -> "Forgot password" -> submit email -> neutral confirmation (same for unknown email).
2. Follow the emailed link -> enter the new password twice -> success when matching + policy-valid.
3. Old password rejected; new password works; other sessions were revoked.
4. Reuse the link -> clear error + path to request a new one.

### US4 — User settings
1. Account menu -> Settings (only reachable when authenticated).
2. Change password (current + new twice) -> other sessions revoked, current stays valid; new password
   works next sign-in.
3. Upload a PNG/JPEG/WebP <=5MB -> shown in settings + sidebar; remove -> initials fallback.
4. Name + email are read-only; the `super_admin` account is read-only.

## 5. Test commands

```powershell
pnpm --filter @modular-house/api test:run
pnpm --filter @modular-house/web test:run
pnpm --filter @modular-house/api test:coverage   # security modules must hit 100% branch
pnpm --filter @modular-house/api docs:validate    # OpenAPI contract validation
```

---

## 6. FR -> Test traceability (DoD-2)

| FR | Summary | Primary test(s) |
|----|---------|-----------------|
| FR-001 | Remove legacy admin | T-F1 (no legacy route) + removal check |
| FR-002 | Design-system parity | T-F1 (shell tokens/layout) + visual-parity checklist |
| FR-003 | Auth-only access; redirect to login | T-F6 (guard), E-SESSION |
| FR-004 | Admin DS isolated from public UI | Public-site suite stays green (SC-008) |
| FR-005 | Login v1, no Google | T-F6 (login renders, no Google) |
| FR-006 | Registration replaced by reset | T-F6 (forgot-password entry) |
| FR-007 | DB-backed creds, no hardcoded | T-B1, E-CREDS |
| FR-008 | Generic invalid-credentials | E-CREDS (A5) |
| FR-009 | Account lockout | E-LOCK (A2/A3) |
| FR-010 | OTP generated, hashed, emailed | T-B1, E-OTP (B1,B2,B8) |
| FR-011 | Session only after valid code | T-B1 (B7) |
| FR-012 | OTP TTL, single-use, attempt cap | E-OTP (B3,B4,B5) |
| FR-013 | New code invalidates prior; rate-limited | E-OTP (B6), E-THROTTLE (F1,F2) |
| FR-014 | Request reset by email | T-B2 |
| FR-015 | Single-use link only if account exists; neutral | T-B2, E-RESET (C4) |
| FR-016 | New password twice + policy | E-POLICY (D1-D4) |
| FR-017 | Link invalidated after use/expiry | E-RESET (C2,C3) |
| FR-018 | Reset clears lockout | E-RESET (C5) |
| FR-019 | Single password policy server-side | E-POLICY (D1-D7) |
| FR-020 | Reusable sidebar + top bar | T-F1 |
| FR-021 | Faded "Coming Soon", no feature pages | T-F1 (H7) |
| FR-022 | Bottom user section | T-F1 |
| FR-023 | Top-bar controls; no GitHub | T-F1 (H7) |
| FR-024 | Persist collapse + theme, no flash | T-F2 (H1,H2), T-B7 (server load) |
| FR-025 | Account menu -> Settings + Logout | T-F4, T-F6 |
| FR-026 | Responsive across breakpoints | T-F5 (H5) |
| FR-027 | Mobile-optimized + mobile design doc | T-F5 + DoD-8 doc check |
| FR-028 | Light/dark via tokens | T-F2 |
| FR-029 | Default preset + 1 font, extensible | research R1/R7 + token tests |
| FR-030 | WCAG AA + keyboard incl. sidebar toggle | T-F3 (H6) |
| FR-031 | Pre-auth pages WCAG AA + keyboard | T-F6 (H6) |
| FR-032 | Settings password change | T-B3, E-POLICY (D5) |
| FR-033 | Profile photo change + validation | T-B4 (G6 retrieval), E-PHOTO (G1-G3) |
| FR-034 | Name/email read-only | T-F6 |
| FR-035 | super_admin read-only | E-SUPERADMIN (settings 403) |
| FR-036 | Session carries role + permissions | T-B5 |
| FR-037 | Audit auth events (incl. password change) | T-B6 (I1) |
| FR-038 | Logout invalidates refresh credential | T-F4, E-SESSION (E5) |
| FR-039 | Secrets hashed, never logged/returned | unit tests on hashing + log assertions |
| FR-040 | Secure session storage (no browser secret) | E-SESSION (E2,E3) |
| FR-041 | Change/reset revokes other sessions | T-B3, E-RESET (C6,E6) |
| FR-042 | Resend cooldown + countdown | E-THROTTLE (F1) |
| FR-043 | Window cap, neutral throttle | E-THROTTLE (F2,F3) |

> Every FR maps to at least one automated test. Any new code path without a referenced test fails
> DoD-2 and must not merge.
