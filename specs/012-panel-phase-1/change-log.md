# The Change Log of Branch 012-panel-phase-1
Note: keep the most latest entry on top

> ## [YYYY-MM-DDTHH:mm:ss.sss+00:00] - [git commit hash] - [commit title] (one line summary, only include section true to the commit)
> ### Added 
> - 
> 
> ### Changed
> - 
> 
> ### Fixed
> - 
> 
> ### Removed
> - 
> 
> ### Security
> - 
---

## [2026-07-08T10:15:00.000+00:00] — test(admin-auth): T110 E-RESET edge-case tests (C2/C3/C4/C6)

### Added
- `apps/api/tests/integration/edge-reset.test.ts` — 4 integration tests pinning password-reset boundary behavior beyond the coarser Pass-1 coverage in `auth-forgot-password.test.ts` (T040) and `auth-reset-password.test.ts` (T042). (1) C4: unknown email produces a byte-identical neutral response to a known email, and no email is dispatched — verified by asserting the response body `toEqual` the known-email body and the mailer mock call count. (2) C2: a reset token issued via the injected clock so its `expiresAt` lands exactly 1 second in the past is rejected with 410, and the token row is never marked consumed (expiry short-circuits ahead of C3). (3) C3: an already-consumed reset token is rejected with 410 and the response carries the "expired or already been used" message (FR-017). (4) C6: three independent refresh-token families seeded for the same user are ALL revoked (non-null `revokedAt`) after a successful password reset — verifying account-wide revocation, not just single-family. The mailer is mocked at the module boundary (`vi.mock('../../src/services/mailer.js', ...)`). A unique `X-Forwarded-For: 203.0.113.110` header isolates this file from the process-wide in-memory auth rate-limit store (F4).

### Notes
- All 4 tests passed immediately against the existing implementation — no gaps exposed. `passwordResetToken.ts` and `auth.ts` (service) stay at 100% branch coverage. Full API suite: 341 → 345 tests (43 → 44 files).

---

## [2026-07-08T10:00:00.000+00:00] — docs(specs): T109 verified pre-existing OTP hardening (B3–B6/B9)

### Notes
- **No code change required.** `LoginCodeService.verify()` already implements B3 (TTL expiry check), B4 (single-use `consumedAt` guard), B5 (attempt-count cap at `OTP_MAX_ATTEMPTS`), B6 (supersede via `issue()`/`resend()` invalidating prior unconsumed codes), and B9 (`challengeId` resolution returning `unknown_challenge` for missing rows). `LoginCodeService.resend()` reuses the same `challengeId` across resends (B9 stability) and invalidates the prior code (B6). The `verify-2fa` route delegates to `AuthService.verifyOtp()` which calls `LoginCodeService.verify()`. The `resend-code` route resolves the `challengeId` to a user row and delegates to `LoginCodeService.resend()`, returning 401 for unknown challenges.
- All 6 T108 edge-otp tests pass (B3/B4/B5/B5-boundary/B6+B9/B9-unknown). Full API suite: 341/341 green. `loginCode.ts` and `auth.ts` (service) remain at 100% branch/stmt/func/line coverage. Lint and typecheck clean.

---

## [2026-07-07T16:05:00.000+00:00]- test(admin-auth): T108 E-OTP edge-case tests (B3/B4/B5/B6/B9)

### Added
- `apps/api/tests/integration/edge-otp.test.ts` — 6 integration tests pinning OTP boundary behavior beyond the coarser Pass-1 coverage in `auth-verify-2fa.test.ts` (T036) and `auth-resend-code.test.ts` (T038). (1) B5: a single wrong-code submission increments `attemptCount` by exactly 1 (not just the aggregate-after-5 check the Pass-1 test already had). (2) B3: a code issued via the injected clock so its `expiresAt` lands exactly 1 second in the past is rejected, and — since expiry is checked before the single-use check in `LoginCodeService.verify()` — the row is never marked consumed. (3) B4: reuse of an already-consumed code is rejected end-to-end via HTTP. (4) B5 boundary: `OTP_MAX_ATTEMPTS - 1` wrong submissions each fail but leave the code usable (`attemptCount` pinned at the boundary); the next submission after `attemptCount` reaches `OTP_MAX_ATTEMPTS` is rejected even with the correct code. (5) B6/B9: a resend supersedes the prior code end-to-end — the code is captured from the mocked mailer's email body (B2 forbids returning it in the response), the OLD code is confirmed rejected post-resend, and the NEW code succeeds via the same stable `challengeId`. (6) B9: an unknown `challengeId` returns 401 on both `verify-2fa` and `resend-code`, with no email sent for the latter. The mailer is mocked at the module boundary (`vi.mock('../../src/services/mailer.js', ...)`) so no SMTP call leaves the test process. Runs against the Phase 1 test DB on port 5434.

### Notes
- **One real gap closed, not zero (unlike T104/T106/T107).** The unknown-`challengeId` branch in the `resend-code` route (`routes/admin/auth.ts:287`, `if (!existing) { ... 401 ... }`) had no prior test coverage — confirmed via `pnpm --filter @modular-house/api test:coverage` before this session (branch was in the uncovered list) and after (branch coverage for `routes/admin/auth.ts` moved from 81.31% to 82.41%). All other assertions passed immediately against the existing `LoginCodeService`/`verify-2fa`/`resend-code` implementation — no further gaps exposed. `services/loginCode.ts` and `services/auth.ts` stay at 100% branch/stmt/func/line.
- **Injected clock scope.** Same constraint as T106: `verify-2fa` and `resend-code` construct `AuthService`/`LoginCodeService` with the default real-time clock, so TTL/expiry checks at request time use real `Date.now()`. The injected clock (via the `issueCodeAt` helper, matching the pattern already established in T036/T038) controls only the *stored* `issuedAt`/`expiresAt` on the seeded row, giving an exact, reproducible boundary (`expiresAt` precisely 1 second in the past) without waiting on real wall-clock time.
- **Rate-limit isolation added defensively.** An initial `pnpm --filter @modular-house/api test:coverage` run flaked once on the unrelated `auth-login.test.ts` F4 test (1/3 runs); two immediate reruns passed cleanly (341/341), so it was not a deterministic failure. Since this file's ~15 HTTP requests originally shared the default (no `X-Forwarded-For`) IP bucket of the process-wide in-memory `authRateLimit` store, `verify2fa()`/`resendCode()` helpers were added that set a unique `X-Forwarded-For: 203.0.113.108` header on every request, matching the isolation pattern already established in `edge-lockout.test.ts`. Three subsequent `test:coverage` runs post-fix were all clean (341/341 each).
- Full API suite: 335 → 341 tests (42 → 43 files).

---

## [2026-07-07T15:45:00.000+00:00] - docs(admin-auth): T107 verify lockout hardening already complete (A2/A3/A4/C5)

### Notes
- **No code change required.** T107's `Do:` ("Enforce `failedLoginAttempts>=5` -> `lockedUntil=now+15m`; reset clears counters") describes behavior already implemented before this session: A2/A3/A4 live entirely in `AuthService.verifyCredentials` (`apps/api/src/services/auth.ts`, the `!isValid` branch increments `failedLoginAttempts` and sets `lockedUntil = now + LOCKOUT_DURATION_MS` at the threshold; the success branch resets both to `0`/`null`), and C5 (reset-clears-lock) lives in the `POST /admin/auth/reset-password` route's transaction (`apps/api/src/routes/admin/auth.ts`), which zeroes `failedLoginAttempts`/`lockedUntil` alongside the password-hash update. T106's edge tests (Session 40) already confirmed this end-to-end with no gaps.
- **100% branch coverage confirmed on lockout paths.** `pnpm --filter @modular-house/api test:coverage` (335/335 tests green) reports `apps/api/src/services/auth.ts` at 100% statements/branches/functions/lines. `apps/api/src/routes/admin/auth.ts` is at 81.31% branch overall, but all 17 currently-uncovered branches were inspected individually (lines 63, 150, 192, 205, 287, 300, 327, 347, 452, 517, 530, 565, 610, 659, 662, 682, 692) and none fall within the lockout (`/login` 423 branch, lines 56-116) or reset-clears-lock (`/reset-password` transaction, lines 543-557) code paths — they belong to OTP/resend (T108-T109), reset-token validity (T110-T111), password policy (T112-T113), and the unrelated `/me` endpoint, all owned by later Pass 2 tasks.
- Verification-only session: no source or test files were modified; working tree stayed clean before and after the coverage run (`coverage/` is gitignored).

---

## [2026-07-07T15:25:00.000+00:00] - test(admin-auth): T106 E-LOCK lockout boundary tests (A2/A3/C5)

### Added
- `apps/api/tests/integration/edge-lockout.test.ts` — 3 integration tests pinning the account-lockout boundary and its interaction with password reset (E-LOCK, A2/A3/C5, FR-009/FR-018). (1) A2 boundary: `LOCKOUT_THRESHOLD - 1` (4) consecutive wrong passwords all return the generic 401 and leave `failedLoginAttempts` below the threshold with `lockedUntil` null. (2) A2/A3: the `LOCKOUT_THRESHOLD`-th (5th) consecutive wrong password returns 401 and SETS the lock — `failedLoginAttempts` reaches 5 and `lockedUntil` is set to ~now + `LOCKOUT_DURATION_MS` (15m), asserted within a ±1s window of real `Date.now()` around the 5th request (the login route constructs `new AuthService()` with the default real-time clock, so the lockout timestamp is real-wall-clock-derived); a subsequent attempt during the lock window is blocked with 423 (even with the correct password), no `challengeId`/`accessToken` is returned, and the mailer is not called (no OTP issued). (3) C5: after seeding the lock directly, a reset token issued via `PasswordResetTokenService(prisma, clock.now)` with the injected clock at real-now (so its 60m TTL is valid relative to the route's real-time expiry check, per R11/T042 precedent) is consumed through `POST /admin/auth/reset-password`; the route clears `failedLoginAttempts` to 0 and `lockedUntil` to null, and a follow-up login with the new password returns 200 (2FA challenge, not 423), confirming the lock is cleared end-to-end. The mailer is mocked at the module boundary (`vi.mock('../../src/services/mailer.js', ...)`) so no SMTP call leaves the test process; a unique `X-Forwarded-For` IP (`203.0.113.106`) isolates the file from the process-wide in-memory auth rate-limit store (F4). Audit rows are deleted before the user in `afterAll` (RESTRICT FK on `audit_logs.user_id`). Runs against the Phase 1 test DB on port 5434.

### Notes
- **No gaps exposed (T104 precedent).** The `Done when: Tests fail for A2/A3/C5` condition is not literally met: the Pass-1 implementation (T031 `AuthService.verifyCredentials`, T043 `reset-password` route) already satisfies A2/A3/C5, so all 3 tests pass immediately. This is the same accepted "expose gaps" pattern as T104 (E-CREDS), where the test was written against an already-correct implementation and `Done when: Tests fail (or expose gaps)` was satisfied with no gaps found; the tests now pin the behavior against future regressions. The "(423)" in the task text refers to the during-lock status (the 6th attempt), consistent with the reviewed T032 lockout test (`auth-login.test.ts:146-163`) which asserts all 5 wrong-password attempts return 401 and the next attempt during the lock returns 423; T107's `Files:` lists only `services/auth.ts` (not T032's test), so the 5th→401 contract must be preserved.
- **Injected clock scope.** The task directs "with the injected clock"; the lockout timestamp is set by the login route using the default real-time clock (`new AuthService()`), so the injected clock cannot control `lockedUntil` via the HTTP path. The injected clock is used where it is genuinely controllable — issuing the reset token at a known timestamp (C5 test). The A3 duration assertion uses real `Date.now()` bounds plus the pinned `LOCKOUT_DURATION_MS` constant, pinning the 15m value without depending on the injected clock for the route's lockout write.

---

## [2026-07-07T13:00:00.000+00:00] - fix(admin-auth): T105 review nits — verifyOtp isActive recheck + argon2 call-assert

### Changed
- `apps/api/src/services/auth.ts` — `verifyOtp` now re-checks `!user.isActive` after `loadUser` and before minting the access token. A6's full text says "cannot complete sign-in even with correct credentials and a valid code"; previously `verifyOtp` did not re-check `isActive`, so a deactivated account that obtained a valid OTP (e.g., deactivated after the OTP was issued but before the 2FA verify step) could complete sign-in and receive an access + refresh token. The new check returns `{ success: false, status: 401, message: 'Invalid credentials' }` — the same generic 401 as the credential-step block, preserving A5 byte-identity. `services/auth.ts` stays at 100% branch/stmt/func/line (the new `if (!user.isActive)` is a simple true/false branch; true path covered by the new unit test, false path by the existing verifyOtp success tests).

### Fixed
- `apps/api/tests/unit/auth.test.ts` — two corrections addressing Session 38 review nits: (1) The A6 `verifyCredentials` unit test now stores the mock user in a variable and asserts `expect(mockArgon2.verify).toHaveBeenCalledWith(user.passwordHash, 'CorrectPassword1!')` — this pins the T105 post-credential ordering so a future refactor cannot silently move the `isActive` check back before `argon2.verify` without breaking the test. (2) A new unit test "returns failure when the account is deactivated even with a valid code (A6)" exercises the `verifyOtp` `isActive` recheck: a deactivated user with a valid OTP code gets `{ success: false, status: 401 }` and no `accessToken`/`rawRefreshToken`. Unit suite goes from 32 → 33 tests; full API suite 331 → 332.

### Security
- A6 closed end-to-end: a deactivated account is now blocked at BOTH the credential step (`verifyCredentials`, post-argon2) AND the 2FA verify step (`verifyOtp`, post-loadUser). The race window where an account is deactivated between OTP issue and 2FA verify is now closed — the deactivated account cannot obtain an access token even with a valid, unexpired code.

---

## [2026-07-07T12:15:00.000+00:00] - fix(admin-auth): T105 block inactive accounts post-credential (A6)

### Changed
- `apps/api/src/services/auth.ts` — `verifyCredentials` reordered: the `!user.isActive` (A6) check was moved from **before** `argon2.verify` to **after** it ("post-credential"). Previously a deactivated account returned `401` in ≈30ms (no argon2 work), while an active account with a wrong password took ≈120ms (argon2 verify) — a timing side-channel leaking whether the account is active. Now `argon2.verify` runs for ALL accounts (including deactivated), so the deactivated-with-correct-password path takes the same argon2 time as the active-with-correct-password path. The lockout-increment path (`!isValid` branch) is now only reachable for active accounts because deactivated accounts are caught by the `!user.isActive` check first — this prevents a deactivated account from accumulating `failedLoginAttempts` and transitioning to `423` (which would break A5/A6's byte-identical `401`). All three failure cases (unknown email, wrong password, deactivated) still return the identical 56-byte body `{"error":"Unauthorized","message":"Invalid credentials"}`; `services/auth.ts` stays at 100% branch/stmt/func/line coverage (the reordered `if (!user.isActive)` is a simple true/false branch covered by the existing A6 unit test for the true path and the wrong-password/success tests for the false path; no new branch introduced). No change to any response shape, status code, or audit behavior.

### Security
- A6 / A5 timing hardening: the deactivated-account check now happens post-credential (after `argon2.verify`), closing the timing side-channel where a deactivated account responded faster than a wrong-password attempt on an active account. The response body remains byte-identical across all three 401 cases (A5 preserved). A residual timing side-channel remains for **unknown email** (no `argon2.verify` runs because no user row is found) — equalizing that would require a dummy argon2 hash verification, which is beyond T105's `Do:` scope ("block inactive accounts post-credential") and not pinned by T104's byte-identity test (which checks body bytes, not timing).

### Notes
- **Route not touched.** The task `Files:` lists `apps/api/src/routes/admin/auth.ts`, but the route's response construction (`res.status(result.status).json({ error: result.status === 423 ? 'Locked' : 'Unauthorized', message: result.message })`) was already normalized — all 401 cases produce the identical body. T104's byte-identity test (`res.text` comparison) confirmed this in the previous session. No route change was needed; the `Do:` directive "Normalize responses to byte-identical 401" was already satisfied.
- **`verifyOtp` not touched.** A6's full text says "cannot complete sign-in even with correct credentials and a valid code." The `verifyOtp` path does not re-check `isActive`, so a deactivated account that somehow obtains a valid code (e.g., deactivated after OTP issue but before 2FA verify) could complete sign-in. This is beyond T105's `Do:` ("block inactive accounts post-credential" = the credential step, not the OTP step) and was flagged in the T104 handoff for the reviewer to decide whether a future task owns it.

---

## [2026-07-07T11:50:00.000+00:00] - test(admin-auth): T104 E-CREDS edge-case tests (A5/A6)

### Added
- `apps/api/tests/integration/edge-creds.test.ts` — 4 integration tests pinning the generic-credential non-enumeration contract on `POST /admin/auth/login` (A5/A6, FR-008). Three single-case tests assert each failure path returns a generic `401` with body `{ error: 'Unauthorized', message: 'Invalid credentials' }` and leaks no `accessToken`/`challengeId`: (1) unknown email, (2) wrong password on a known active account, (3) a deactivated account (`isActive=false`) submitted with the correct password. The fourth test sends all three requests in sequence and asserts **byte-identity** by comparing the raw response body string (`res.text`) and the `content-type` header — no field, value, or key-ordering difference may leak which case triggered the failure. The suite seeds one active and one deactivated user (both with the same correct password) via `prisma.user.create` in `beforeAll`; `beforeEach` resets Phase 1 tables, audit rows, and lockout counters per user so failure counters never accumulate toward the A2 threshold. `afterAll` deletes audit rows before users (RESTRICT FK on `audit_logs.user_id`, same pattern as auth.spec.ts/audit-events.test.ts). The `MailerService` is mocked at the module boundary (`vi.mock('../../src/services/mailer.js', ...)`) so no SMTP call leaves the test process. Runs against the Phase 1 test DB on port 5434.

### Security
- A5 / FR-008: the byte-identity assertion (`res.text` comparison, not just parsed shape) closes the enumeration vector at the response-body level — an attacker cannot distinguish unknown-email from wrong-password from deactivated by inspecting the raw bytes. A6: the deactivated-account test confirms `isActive=false` accounts cannot even reach the OTP-issue step when the password is correct (the service checks `isActive` before `argon2.verify`). Note: a timing side-channel remains (wrong-password runs argon2 ≈120ms; unknown-email/deactivated return in ≈30ms) — that is a T105 concern, not an A5 body-identity defect.

### Notes
- The implementation in `AuthService.verifyCredentials` (T031) and the login route (T033) already satisfy A5/A6: all three failure cases return the identical 56-byte body `{"error":"Unauthorized","message":"Invalid credentials"}` (confirmed by `content-length: 56` in the request logs). The test therefore passes immediately — this is the "expose gaps" branch of `Done when: Tests fail (or expose gaps)`; no gaps were exposed. The test now pins the behavior against future regressions (same accepted TDD pattern as T023/T065 where the impl preceded the test).

---

## [2026-07-07T09:50:00.000+00:00] - feat(admin-auth): T103 add Pino log redaction

### Added
- `apps/api/src/middleware/logger.ts` — exported `REDACT_PATHS` constant (16 field paths: 8 top-level credential keys `password`, `newPassword`, `currentPassword`, `confirmPassword`, `token`, `code`, `otp`, `refreshToken` plus the 8 nested `body.*` counterparts) and wired a `redact: { paths, censor: '[Redacted]' }` option into the base `pino({...})` instance. Pino walks these paths at serialization time and replaces each matching value with `[Redacted]` before the line reaches the output stream, so secrets never appear in log output regardless of how a caller constructs the log object. The primary vector this closes is `validate.ts` line 223, which logs `body: req.body` verbatim on Zod validation failure — a malformed login / reset / change request would otherwise write the raw password, OTP code, or reset token to stdout. The `REDACT_PATHS` export ties the T102 test to the exact production configuration via `importOriginal`. Additive only — the array is open for new field names without touching existing entries (Open-Closed).

### Security
- FR-039 / I3: secrets (passwords, OTP codes, reset tokens) are now redacted at the Pino serialization layer, complementing the audit-entry I3 check (T101) by closing the log-line channel. The redaction is defense in depth — it catches both the known `validate.ts` body-logging vector and any future accidental `logger.info({ password })` call.

### Notes
- Deviation from task file path: T103 lists `apps/api/src/config/logger.ts`, but the Pino logger instance was created at `apps/api/src/middleware/logger.ts` by an earlier task (the `config/` directory holds `env.ts` and `adminAuth.ts` only). Redaction must be applied where the `pino({...})` instance is constructed, so the `redact` option and `REDACT_PATHS` export were added to `middleware/logger.ts`. Creating a separate `config/logger.ts` would either duplicate the singleton (breaking the single-source-of-truth) or be a dead module that nothing imports.

---

### Added
- `apps/api/tests/integration/log-redaction.test.ts` — 10 integration tests verifying no raw password, OTP code, or reset token ever reaches a Pino log line across the four authentication flows (login, 2FA, reset, change) plus direct redaction of top-level and `body.*` secret field paths. The test mocks `middleware/logger.js` via `vi.mock` + `importOriginal` so every `logger.*` call routes to an in-memory `Writable` capture stream configured with the SAME redact paths the production logger exports (`REDACT_PATHS`, added in T103). Before T103 the paths array is empty and 6 tests fail because secrets leak — the primary vector is `validate.ts` line 223 which logs `body: req.body` verbatim on Zod validation failure (e.g. a malformed login body includes the raw password in the log stream). The 4 success-flow tests pass in both phases because validation succeeds and the body is never logged. MailerService mocked at the module boundary; per-test slate scoped to the test user (same pattern as audit-events.test.ts). Runs against the test DB on port 5434.

### Security
- FR-039 / I3: complements the audit-entry check (T101) by covering the log-line channel. Secrets that never reach the audit writer can still leak via the body-validation middleware's diagnostic log — this test pins that vector closed once T103 adds Pino redaction.

---

### Changed
- `apps/api/src/services/auth.ts` — `CredentialResult` now carries `userId` on both arms: `{ success: true; challengeId; userId: string }` and `{ success: false; status; message; userId: string | null }`. The five return points in `verifyCredentials` thread through the `user.id` the method already loads (real id on every known-account branch; `null` on unknown email per I2). This is purely additive — existing callers that ignore `userId` are unaffected — and makes the service the single source of truth for user resolution, eliminating the duplicate `prisma.user.findUnique` the route previously performed. `services/auth.ts` stays at 100% branch coverage (no new branches, only added fields on existing returns).
- `apps/api/src/routes/admin/auth.ts` — POST `/login` no longer performs its own `prisma.user.findUnique` to resolve the audit userId; it reads `result.userId` directly from `verifyCredentials` for both the LOGIN_FAILURE and LOGIN_SUCCESS/OTP_ISSUED audit calls. Removes one DB query per login request with no change to any response shape or status code.
- `apps/api/tests/unit/auth.test.ts` — three `verifyCredentials` tests now pin the new `userId` contract: `null` on unknown email (A5), the known account's id on wrong-password failure (A5), and the authenticated account's id on success (B7).

### Security
- I2 preserved: unknown-email login failures still pass `userId: null` and AuditLogService skips the write (no account-existence leak in the audit trail). Known-account failures (wrong password, deactivated, locked) now attribute the real userId from the service's own lookup — no second query, no timing side channel.

---

## [2026-07-06T15:55:00.000+00:00] - fix(admin-auth): T100a followup — clear audit_logs before user delete in auth.spec.ts

### Fixed
- `apps/api/tests/integration/auth.spec.ts` — the pre-existing feature-006 Admin Auth Endpoints suite creates a test user and deletes it in `beforeAll`/`afterAll`; T100a's audit wiring now writes `audit_logs` rows for that user during the login/logout flows, and the reused `AuditLog` table has a RESTRICT foreign key on `user_id`, so the bare `prisma.user.deleteMany` began failing with a FK violation (caught at the §9 full-suite gate). Both `beforeAll` and `afterAll` now look up the user and delete its `audit_logs` rows before deleting the user, restoring the suite to green (317/317) without changing any assertion or response shape.

---

## [2026-07-06T15:50:00.000+00:00] - test(admin-auth): T101 audit events integration test

### Added
- `apps/api/tests/integration/audit-events.test.ts` — 10 integration tests driving every authentication flow against the test DB and asserting the reused `AuditLog` table receives exactly the expected I1 action: LOGIN_SUCCESS + OTP_ISSUED (login success), LOGIN_FAILURE (known-account wrong password), OTP_VERIFIED (verify-2fa success), OTP_ISSUED (resend-code success), LOGOUT, PASSWORD_RESET_REQUESTED (forgot-password known non-throttled), PASSWORD_RESET_COMPLETED (reset-password), PASSWORD_CHANGED (settings password). I2 coverage: unknown-email login failure and unknown-email forgot-password produce NO audit row (null userId skipped by AuditLogService). I3 coverage: the raw password, OTP code, and reset token are asserted absent from every audit row's writable fields. MailerService mocked at the module boundary; per-test audit slate scoped to the test user. TDD red-phase unverifiable retroactively — T100a (impl) precedes T101 (test) by explicit Session 34 task ordering (option b), same accepted non-blocking pattern as T023/T065/T086.

---

## [2026-07-06T15:45:00.000+00:00] - feat(admin-auth): T100a wire AuditLogService into auth and settings routes

### Added
- `apps/api/src/routes/admin/auth.ts` — wired `AuditLogService.log()` (T016) into all seven auth-route I1 call sites: `LOGIN_SUCCESS` + `OTP_ISSUED` (POST /login success branch), `LOGIN_FAILURE` (POST /login failure branch), `OTP_VERIFIED` (POST /verify-2fa success only), `OTP_ISSUED` (POST /resend-code success), `PASSWORD_RESET_REQUESTED` (POST /forgot-password known-email non-throttled branch only), `PASSWORD_RESET_COMPLETED` (POST /reset-password success), `LOGOUT` (POST /logout). Added a module-level `AuditLogService` (sharing the existing Prisma client) and a `recordAudit` helper that awaits the write but swallows+logs any failure so audit never alters the HTTP response (FR-037). `entity: 'user'` is consistent across all calls; only action/entity/userId/ipAddress/userAgent are passed (I3 — no code, token, or password). `ipAddress` from `req.ip ?? 'unknown'`, `userAgent` from `req.headers['user-agent'] ?? null` (I2). POST /login resolves the acting userId by email once for both branches (null on unknown email → AuditLogService skips the write per the non-null FK constraint, I2); `verifyCredentials` surfaces userId on neither branch so the lookup is required.
- `apps/api/src/routes/admin/settings.ts` — wired `PASSWORD_CHANGED` (I1) into PUT /admin/settings/password success branch via the same `AuditLogService` + `recordAudit` pattern; placed after the successful `changePassword` so 401/403/400 branches return before any audit write.

### Security
- FR-037 / I1–I3: every authentication-related event in the I1 set is now persisted to the reused `AuditLog` table. Unknown-email login failures pass `userId: null` and are silently skipped (no row) so the audit trail never records a non-existent account, while known-account failures (wrong password, deactivated, locked) record the real userId for brute-force traceability. No secret (password, OTP code, reset token) is ever passed to the audit writer.

---

## [2026-07-06T14:55:00.000+00:00] - fix(admin/shell): apply Session 31 review nits for T098

### Fixed
- `apps/web/src/App.tsx` — added `.catch()` to the fire-and-forget preferences PUT so a network-level rejection (DNS, connection refused, CORS) doesn't become an unhandled promise rejection; `apiClient.fetch` resolves on non-2xx HTTP statuses but rejects on transport failure, and the catch swallows those silently since the optimistic local state + cookie mirror already applied.
- `apps/web/src/admin/theme/ThemeProvider.tsx` — replaced the local `interface Preferences` with `import type { Preferences } from '../auth/types.js'` (re-exported), eliminating the structural duplicate that could drift silently; `auth/types.ts` is now the single source of truth matching the OpenAPI Preferences schema.

---

## [2026-07-06T14:10:00.000+00:00] - test(admin/shell): add mobile off-canvas drawer test (T100)

### Added
- `apps/web/src/admin/shell/mobile.test.tsx` — 8 tests pinning T-F5: below the 768px breakpoint (matchMedia `(max-width: 767px)` mocked to match) the desktop sidebar is absent from normal flow and the sidebar renders as an off-canvas Radix Dialog drawer (`data-mobile="true"`, `fixed` overlay) that opens via the sidebar trigger and closes on a second toggle; all four top-bar controls remain present and keyboard-focusable on mobile; the no-horizontal-scroll contract at >=320px is pinned structurally (admin root `w-full`, drawer `fixed` out of flow, no in-flow `sidebar-gap`) since jsdom cannot compute layout.

---

## [2026-07-06T14:05:00.000+00:00] - test(admin/shell): add keyboard operability test (T099)

### Added
- `apps/web/src/admin/shell/keyboard.test.tsx` — 7 tests pinning T-F3: every always-visible shell control (sidebar identity, user-section, sidebar-trigger, preferences, theme-toggle, account) is keyboard-focusable with the H4 focus-visible ring (`ring-3 ring-ring/50`), and Ctrl/Cmd+B toggles the sidebar (H2) via the SidebarProvider window listener driving the controlled ThemeProvider collapse state (`data-sidebar-collapsed`). Plain B without a modifier is ignored.

---

## [2026-07-06T12:41:16.510+00:00] - [f552f87] - feat(admin/shell): wire theme + sidebar server round-trip (T098)

### Added
- `apps/web/src/admin/theme/ThemeProvider.tsx` — optional `initialPreferences` + `onPreferencesChange` props; adopts the server-stored preference from /me once as authoritative (H1/H2), refreshes the cookie mirror for pre-paint, and notifies the parent with the full preferences object on every local toggle. Exports the `Preferences` type.
- `apps/web/src/admin/shell/AppShell.tsx` — `preferences`/`onPreferencesChange` props forwarded to ThemeProvider; inner `ShellLayout` reads `useTheme()` and drives `SidebarProvider` as a controlled component (`open = !sidebarCollapsed`, `onOpenChange` inverts) so the sidebar's open/closed state binds to the single server-persisted source of truth.
- `apps/web/src/App.tsx` — `AdminShell` wires `auth.user.preferences` into AppShell and PUTs the full object to `/admin/settings/preferences` fire-and-forget (FR-024); local state + cookie mirror update optimistically so the UI never waits on the network.

### Changed
- Sidebar collapse now flows through ThemeProvider (server-persisted, cookie `admin_sidebar_collapsed`) instead of the SidebarProvider's own `sidebar_state` cookie as the source of truth; the primitive still writes `sidebar_state` as a side effect but it is no longer authoritative.

---

## [2026-07-06T12:40:00.000+00:00] - [bf5aef9] - test(admin/shell): add theme + sidebar persistence test (T098)

### Added
- `apps/web/src/admin/shell/persistence.test.tsx` — 5 integration tests rendering the real App at `/admin/settings` with a mocked transport and pre-set access token: /me hydration adopts server preferences as authoritative (H1/H2), theme toggle PUTs the full preferences object to `/admin/settings/preferences` (FR-024), sidebar toggle PUTs the new `sidebarCollapsed`, remount restores state from the server with the cookie mirror kept in sync (no flash, T-F2), and a stale cookie is corrected from the server on hydration. Confirmed red before the wiring landed.

---

## [2026-07-03T09:00:00.000+00:00] - test(admin/pages): add Settings page test (T094)

### Added
- `apps/web/src/admin/pages/Settings.test.tsx` — 17 tests across 5 describe blocks: password-change
  form (current + new twice, mismatch rejection, server-error surfacing), profile photo (initials
  fallback, upload/remove wiring, client-side G1/G2 rejection), read-only name/email (FR-034),
  super_admin read-only (FR-035), and unauthenticated redirect via the real `AuthProvider`/`AdminGuard`
  (not a stub). Confirmed red: fails on missing `./Settings.js` import before T095.

---

## [2026-07-03T09:15:00.000+00:00] - feat(admin/pages): implement Settings page (T095)

### Added
- `apps/web/src/admin/pages/Settings.tsx` — own-account settings page. Reads identity/role from
  `useAuth()`; wires password change (`PUT /admin/settings/password`) and profile-photo
  upload/remove/fetch (`PUT`/`DELETE`/`GET /admin/settings/photo`) directly to the admin `apiClient`.
  Photo bytes are fetched with the authenticated client and rendered via an object URL (G6) rather
  than a bare `<img src>`, since the endpoint requires a Bearer token. Client-side mirrors of G1
  (accepted MIME types) and G2 (5 MB max) give immediate feedback; the server stays authoritative.
  Name/email render as read-only text (FR-034). The `super_admin` account hides both the
  password-change and photo-edit cards entirely and shows a database-only notice (FR-035).
  All 17 T094 tests pass; `pnpm --filter @modular-house/web test:run` 208/208, lint + typecheck clean.

---

## [2026-07-03T09:30:00.000+00:00] - feat(admin): T096 wire admin routing into the SPA

### Added
- `apps/web/src/App.tsx` — mounts the full `/admin/*` route tree: `/admin/login`, `/admin/two-factor`,
  `/admin/forgot-password`, and `/admin/reset-password` render standalone (each wrapped in a new local
  `AdminRoot` helper that applies the `.admin-root`/`[data-admin]` scoping the Tailwind v4 + OKLCH
  token layer requires — the pre-auth pages don't self-apply this wrapper). `/admin` and `/admin/settings`
  sit behind a new local `AdminShell` layout component (`AuthProvider` → `AdminRoot` → `AdminGuard` →
  `AdminShell`) that derives the sidebar/top-bar `UserShellData` from `useAuth()` and renders `AppShell`
  around an `<Outlet />`; the index route and any unmatched `/admin/*` path redirect to `/admin/settings`
  (no dashboard/widgets in Phase 1 per plan §5.2). `admin.css` is imported once here so the token layer
  reaches the real bundle for the first time (previously wired by T002/T003 but never imported anywhere).

### Changed
- `apps/web/src/App.tsx` — replaced the "admin routes will be wired in" placeholder comment with the
  live route tree; updated the file's docstring to explain why admin routes are NOT added to
  `route-config.tsx`.

### Notes
- `apps/web/src/route-config.tsx` — intentionally left unchanged. Its `routes` array also feeds
  `scripts/sitemap-generator.ts` and `scripts/prerender.ts`; the admin panel is client-only and
  authenticated, so it must never appear in the sitemap or prerendered output.
- Scope note: no task explicitly assigns wiring the pre-auth pages' `onSubmit`/`onResend` callbacks to
  real `apiClient` calls (login → OTP → session → navigate). T096's own Files:/Done-when are limited to
  routing/mounting, so those callbacks remain the placeholder no-ops they were left as in T086–T089.
  Flagged as a blocker for the next planning pass — see handoff.

---

## [2026-07-03T09:45:00.000+00:00] - test(admin): T097 legacy admin fully removed regression

### Added
- `apps/api/tests/integration/legacy-removed.test.ts` — 11 tests. Git history confirms no backend admin
  route file was ever deleted (the `/admin/auth/*` mount point is unchanged since the very first commit),
  so the "old legacy route returns 404" assertion targets flat/legacy-shaped paths that never existed
  under the current nested router (`GET /admin`, `GET|POST /admin/login`, `POST /admin/logout`,
  `GET /admin/dashboard`) as a regression guard against reintroducing one, plus a check that
  `POST /admin/auth/login` never returns `token`/`accessToken`/`user`/`roles` (the pre-Phase-1 contract),
  plus a consolidated re-gation spot-check across the five retained content endpoints.
- `apps/web/src/admin/__tests__/no-legacy.test.tsx` — 5 tests using `import.meta.glob` (not `node:fs`,
  which isn't typed in this app's browser-targeted tsconfig) to scan every non-test source file under
  `apps/web/src` for the literal string `adminToken`, confirm `src/routes/admin/**` has zero remaining
  modules, and render the real `App` tree at `/admin`, `/admin/login`, and an unmatched `/admin/*` path
  to confirm only the new login page ever resolves (never a legacy dashboard).

### Verification
- `pnpm --filter @modular-house/api test:run -- --no-file-parallelism` — 307/307 pass.
- `pnpm --filter @modular-house/web test:run` — 213/213 pass.
- Both new files' lint + typecheck clean.

---

## [2026-07-03T11:00:00.000+00:00] - fix(admin/shell): apply Session 30 corrective item for T095

### Added
- `apps/web/src/admin/auth/usePhotoUrl.ts` — hook that fetches the authenticated user's profile-photo
  bytes via `apiClient.fetch()` and exposes them as an object URL, re-fetching only when
  `hasProfilePhoto` changes; revokes the previous object URL on cleanup.
- `apps/web/src/admin/shell/AppShell.test.tsx` — 2 new tests covering `hasProfilePhoto: true`: assert
  the authenticated `/admin/settings/photo` fetch fires and that no `<img src="/admin/settings/photo">`
  ever renders directly; assert no fetch fires at all when `hasProfilePhoto` is `false`. This path was
  previously untested (existing tests only covered `hasProfilePhoto: false`), which is how the bug went
  unnoticed until the T095 review.

### Fixed
- `apps/web/src/admin/shell/UserSection.tsx` — sidebar avatar now uses `usePhotoUrl()` instead of a bare
  `<img src="/admin/settings/photo">`. `GET /admin/settings/photo` requires a Bearer token (G6); a plain
  `<img>` tag sends no `Authorization` header, so the request always 401'd and the sidebar silently fell
  back to initials even when a photo was uploaded (broke the sidebar half of US4-4/US4-5).
- `apps/web/src/admin/shell/TopBar.tsx` — same bug, same fix, found by inspection while fixing
  `UserSection.tsx` (the review cited only `UserSection.tsx:43`, but the top-bar account-menu avatar had
  the identical unauthenticated `<img src>` pattern at line 229).

### Verification
- `pnpm --filter @modular-house/web test:run` — 215/215 pass.
- Lint + typecheck clean on all four touched files.

---

## [2026-07-03T11:30:00.000+00:00] - test(admin/pages): T097a pre-auth page wiring test

### Added
- `apps/web/src/admin/pages/preAuthWiring.test.tsx` — 10 tests rendering the real `App` tree (not a
  stubbed route table) driving Login → TwoFactor → session, resend-code, ForgotPassword's neutral
  confirmation, and ResetPassword's consume-and-navigate flow, plus one representative error case for
  each of 423/429 (login), 401 (verify-2fa), and 400/410 (reset-password) — covering all five status
  codes named in the task text. All 10 fail against the current build (no fetch is issued from any
  pre-auth page today), confirming the TDD red phase per T097a's own "Done when".

---

## [2026-07-03T12:00:00.000+00:00] - feat(admin): T097b wire pre-auth pages to the auth client

### Added
- `apps/web/src/App.tsx` — four new local container components (`LoginContainer`,
  `TwoFactorContainer`, `ForgotPasswordContainer`, `ResetPasswordContainer`), matching the existing
  `AdminRoot`/`AdminShell` in-file pattern. Each owns its own `error`/`isSubmitting`/`message` state and
  calls `apiClient.fetch(url, { skipAuth: true, ... })`:
  - Login → `POST /admin/auth/login` → `200` navigates to `/admin/two-factor` passing `challengeId` via
    router state (never the URL, per B9); non-2xx surfaces the response `message` via `error`.
  - TwoFactor → reads `challengeId` from router state (redirects to `/admin/login` if absent);
    `POST /admin/auth/verify-2fa` → `200` calls `apiClient.setAccessToken()` then navigates to `/admin`
    (the mounted `AuthProvider` hydrates itself via `fetchMe()`); `onResend` → `POST
    /admin/auth/resend-code`, disabling the button only while in flight (the cooldown countdown stays
    deferred to T116 per the existing T085 note).
  - ForgotPassword → `POST /admin/auth/forgot-password` → any 2xx sets `isSubmitted=true` regardless of
    body (C4 neutral confirmation).
  - ResetPassword → `POST /admin/auth/reset-password` with the URL's `token` → `200` navigates to
    `/admin/login`; `400`/`410` surface the response `message` via `error`.
  - The routes for `/admin/login`, `/admin/two-factor`, `/admin/forgot-password`, and
    `/admin/reset-password` now render these containers instead of the bare presentational pages;
    `Login.tsx`/`TwoFactor.tsx`/`ForgotPassword.tsx`/`ResetPassword.tsx` are unchanged.

### Verification
- `apps/web/src/admin/pages/preAuthWiring.test.tsx` (T097a) — 10/10 pass (was 10/10 failing before this
  commit).
- `pnpm --filter @modular-house/web test:run` — 225/225 pass.
- Lint + typecheck clean.

### Notes
- **Literal browser walk-through not performed** — see `quickstart.md` §5a. `apps/api/.env` (the file
  `pnpm dev` loads by default) points at the real production SMTP relay and a non-test database port;
  starting the dev server against it risks sending a real email, which isn't a reversible action to take
  without explicit sign-off. Flagged as an open item for a human operator to close with a safe env.

---

## [2026-07-02T16:35:00.000+00:00] - 59b2a0f - fix(admin/auth): apply Session 28 corrective item for T092

### Fixed
- `apps/web/src/admin/auth/AuthProvider.tsx` — `AuthContextValue` now exposes `role`/`permissions` as top-level fields (derived from `user`), per T092's literal "expose user/role/permissions" wording; previously only reachable via `user.role`/`user.permissions`
- `apps/web/src/admin/auth/auth.test.tsx` — added a test pinning `role`/`permissions` availability from `useAuth()` once authenticated

---

## [2026-07-02T15:47:00.000+00:00] - 4ec46e9 - feat(admin/auth): implement auth client, AuthProvider, and route guard

### Added
- `apps/web/src/admin/auth/types.ts` — shared `Me`/`Session`/`Preferences` types matching the OpenAPI schemas
- `apps/web/src/admin/auth/apiClient.ts` — in-memory access token store, `credentials: 'include'` for the refresh cookie, silent refresh-and-retry on 401 (T091)
- `apps/web/src/admin/auth/AuthProvider.tsx` — session hydration via `/admin/auth/me`, exposes user/isAuthenticated/isLoading/logout (T092)
- `apps/web/src/admin/auth/guard.tsx` — `AdminGuard` redirects unauthenticated access to `/admin/login` (T093)
- `apps/web/src/admin/auth/auth.test.tsx` — 10 tests pinning in-memory token storage, silent refresh, logout, and guard redirect (T090)

### Changed
- `apps/web/src/admin/auth/apiClient.ts` — base URL corrected from hardcoded `/api` to `VITE_API_BASE_URL`, matching the existing convention in `apps/web/src/lib/apiClient.ts` (the backend mounts routes at the root, not under `/api`)

---

## [2026-07-02T13:50:00.000+00:00] - 007eff7 - fix(admin/pages): apply Session 26 corrective items for T089

### Fixed
- `apps/web/src/admin/pages/ResetPassword.tsx` — reworded misleading comment at line 178 ("Hidden token field" → "Visible alert when no token is present in the URL query string")
- `apps/web/src/admin/pages/ResetPassword.tsx` — added direct link to `/admin/forgot-password` in missing-token error state per FR-017

---

## [2026-07-02T13:06:00.000+00:00] - cdb455f - feat(admin/pages): implement TwoFactor, ForgotPassword, and ResetPassword pages

### Added
- `apps/web/src/admin/pages/TwoFactor.tsx` — 6-digit OTP code entry with InputOTP, resend control, challengeId binding
- `apps/web/src/admin/pages/ForgotPassword.tsx` — email entry form with neutral confirmation (C4)
- `apps/web/src/admin/pages/ResetPassword.tsx` — token consumption, new+confirm password fields with policy mirror

### Changed
- `apps/web/src/admin/pages/preAuth.test.tsx` — replaced stubs with real component imports; added 9 new assertions (19 total)

---
