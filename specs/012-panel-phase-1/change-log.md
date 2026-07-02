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
