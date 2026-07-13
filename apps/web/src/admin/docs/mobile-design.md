# Admin Panel — Mobile Design (Phase 1)

**Feature**: `012-panel-phase-1` | **Refs**: DoD-8, FR-027, SC-012

This document records the touch-first mobile layout of every Phase 1 surface as actually built, with
the exact classes/behaviour in source and the corresponding reference-template pattern. It is a
record of what ships, not a separate design proposal — Phase 1 has no bespoke mobile designs beyond
what the Studio Admin template (`next_shadcn_admin_dashboard`) already provides at the two app-level
breakpoints:

- **Mobile**: `< 768px` (JS breakpoint via `matchMedia('(max-width: 767px)')`, `sidebar.tsx:47`)
- **Desktop / `lg`**: `>= 1024px` (Tailwind `lg:` prefix)

Everything between 768px and 1024px falls back to the mobile (single-column, off-canvas sidebar)
layout, since the only two states the codebase distinguishes are "mobile drawer" and "`lg` two-column
desktop" — there is no separate tablet-specific layout, matching the template's own convention
(`.doc/design/DESIGN.md`: "two app-specific JS breakpoints: mobile < 768px and lg ≥ 1024px").

---

## 1. Pre-auth pages (Login, TwoFactor, ForgotPassword, ResetPassword)

All four pre-auth pages share one identical responsive structure (`Login.tsx`, `TwoFactor.tsx`,
`ForgotPassword.tsx`, `ResetPassword.tsx` — verified byte-for-byte identical wrapper classes across
all four files):

```
<div class="flex min-h-svh">
  <div class="hidden bg-primary lg:block lg:w-1/3">   <!-- branded panel -->
  <div class="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
    <div class="w-full max-w-md space-y-10 py-24 lg:py-32">  <!-- form card -->
```

- **Below `lg` (mobile + tablet, < 1024px):** the branded left panel (`hidden ... lg:block`) is
  removed from layout entirely — no wasted space, no truncated branding. The form panel becomes
  `w-full`, so the centered `max-w-md` card is the entire viewport, with `p-8` (32px) outer padding
  keeping form fields off the screen edge on narrow phones.
- **At `lg` and above:** the branded panel reappears at `w-1/3`, the form panel narrows to `w-2/3`,
  and vertical padding grows (`py-24` → `lg:py-32`) to center the card in the taller two-column layout.
- **Touch targets:** all inputs and the submit button are full-width (`w-full`) block-level elements
  inside a `flex flex-col gap-4` form — no side-by-side fields at any width, so there is no risk of
  cramped touch targets on narrow screens.
- **TwoFactor-specific:** the OTP entry uses `input-otp` (`InputOTPSlot`), whose slots are laid out in
  a single non-wrapping row sized to fit `max-w-md`; this was verified visually equivalent to the
  reference template's OTP page pattern during the T063–T076 primitive port and re-confirmed in the
  T137 visual-parity review (§8.2 of `quickstart.md`).
- **ResetPassword-specific:** identical wrapper; the only difference from Login is field count
  (new + confirm password) and the token being read from the URL query string, neither of which
  affects layout.

## 2. App shell (sidebar + top bar)

- **Sidebar — mobile (`< 768px`):** renders as an off-canvas drawer (Radix `Dialog` via the `Sheet`
  primitive, `ui/sheet.tsx`) instead of a persistent column. Fixed width **18rem** while open
  (`plan.md` §2.8 H3), triggered by the same `SidebarTrigger` button used on desktop. The drawer
  includes a visually-hidden `SheetTitle`/`SheetDescription` (`sidebar.tsx:172-181`, added in T128) so
  screen-reader users get an accessible name for the off-canvas panel — confirmed by the automated
  a11y suite (T127/T135, 23/23 passing, zero violations on the open drawer).
- **Sidebar — desktop (`>= 768px`):** persistent column, **17rem** expanded / **3rem** icon-rail when
  collapsed (H3), toggled via the same trigger or `Ctrl/Cmd+B`.
- **Top bar:** fixed **48px** height (`h-12`, H3) at every viewport width — it does not change height
  or collapse controls on mobile. All four controls (sidebar-collapse, preferences, theme, account)
  remain visible as `size-8` (32px) icon buttons; there is no overflow/"more" menu, since four icon
  buttons fit comfortably in a 48px bar even on the narrowest supported phone widths. This mirrors the
  reference template's `dashboard/layout.tsx` header exactly (same control count, same `h-12`).
- **Coming Soon content area:** centered `text-2xl` text with generous padding: reflows naturally at
  every width with no dedicated mobile variant needed (there is no content to overflow).

## 3. Settings page

- Single-column stacked layout: `mx-auto max-w-2xl space-y-6 p-6` — every section (profile photo,
  password change) is a full-width `Card` stacked vertically via `space-y-6`. There are no side-by-side
  fields or multi-column grids anywhere on this page, so it requires no separate mobile variant: the
  same markup that renders on desktop already reads correctly on a narrow phone viewport, only capped
  at `max-w-2xl` (42rem) so it doesn't stretch uncomfortably wide on large desktop monitors.
- The photo section (`CardContent` with `flex items-center gap-4`) keeps the avatar and
  upload/remove buttons on one row down to the smallest supported width, since an `Avatar size="lg"`
  plus two buttons comfortably fits a 320px-wide viewport without wrapping.

## 4. Known characteristic (not a Phase 1 regression)

Icon buttons throughout the top bar and sidebar triggers are `size-8` (32px), matching the reference
template exactly. This is below the commonly-cited 44×44px touch-target guideline (WCAG 2.5.5, AAA —
not an AA requirement, so it does not affect the T135 WCAG 2.1 AA audit's zero-critical-violations
result). This is inherited unmodified from the Studio Admin template's own icon-button sizing
(Template Parity Gate, `plan.md` §5A) rather than a Phase 1 choice, and matches the desktop-first
nature of an internal admin tool; flagged here for visibility, not as an outstanding defect.

## 5. Verification basis

This document was written from a direct read of the shipped source (`Login.tsx`, `TwoFactor.tsx`,
`ForgotPassword.tsx`, `ResetPassword.tsx`, `shell/TopBar.tsx`, `shell/Sidebar.tsx`, `ui/sidebar.tsx`,
`pages/Settings.tsx`) and the reference template's `.doc/design/DESIGN.md` breakpoint reference — not
from live device/browser testing, since this session has no browser-automation tooling available. The
automated `a11y.test.tsx` suite (T127/T135) does exercise the mobile off-canvas drawer specifically
(`setMobileViewport(true)`, 23/23 passing, zero axe violations), which is the one mobile-specific
interaction covered by automated tests; a human/QA pass on a real device or emulator is still
recommended before shipping, consistent with the disclosure already recorded for T135/T136.
