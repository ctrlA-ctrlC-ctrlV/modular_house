# ProductConfigurator — Gotcha Remediation Task List

**Source:** [apps/web/src/components/ProductConfigurator/README.md](../apps/web/src/components/ProductConfigurator/README.md) §14 "Gotchas"
**Created:** 2026-04-27
**Goal:** Convert each documented footgun into a concrete, actionable engineering task. Tasks are ordered by **urgency × user impact × implementation cost** (highest first).

Legend: 🔴 High urgency · 🟠 Medium · 🟢 Low. Each task is independently shippable.

---

## T1. 🔴 Make the honeypot bypass observable to operators

**Problem.** When the honeypot field is populated, `submitForm` sets `formStatus = 'success'` and `quoteNumber = 'Q0000000'` *without* calling the API. A developer triaging "the form says success but no email arrived" cannot distinguish a real success from a silently rejected bot.

**Files**
- [apps/web/src/components/ProductConfigurator/useConfiguratorState.ts](../apps/web/src/components/ProductConfigurator/useConfiguratorState.ts) — `submitForm`, honeypot branch.

**Acceptance criteria**
1. The fake-success branch emits a single structured log (e.g. `console.warn('[configurator] honeypot triggered', { slug, ts })`) — never logs the user's PII.
2. The placeholder quote number is moved to a named constant `HONEYPOT_FAKE_QUOTE_NUMBER` (current value `'Q0000000'`) co-located with the honeypot branch and referenced in a comment in [README.md §14](../apps/web/src/components/ProductConfigurator/README.md).
3. No change to user-facing UX (bots must still see a normal success screen).
4. Update the existing test file or add one new case covering: honeypot populated → API client *not* called → status === `'success'` → `quoteNumber === HONEYPOT_FAKE_QUOTE_NUMBER`.

**Out of scope.** Server-side telemetry; rate-limiting; CAPTCHA.

---

## T2. 🔴 Guard against `formData` accidentally being persisted

**Problem.** `formData` is intentionally excluded from `sessionStorage`, but the omission is enforced only by convention. A future contributor adding a field to `PersistedState` could regress privacy.

**Files**
- [apps/web/src/components/ProductConfigurator/useConfiguratorState.ts](../apps/web/src/components/ProductConfigurator/useConfiguratorState.ts) — `PersistedState` interface, `savePersistedState`.

**Acceptance criteria**
1. Add an inline comment block above `PersistedState` listing the three permitted fields and stating: "DO NOT add `formData`, `formStatus`, `quoteNumber`, `formError`, or `formValidationErrors` here — they are intentionally session-fresh for privacy and to avoid stale validation errors."
2. Add a unit test that fills `formData` via `updateFormField`, then reads `sessionStorage.getItem('configurator-state:<slug>')` and asserts the parsed JSON has exactly the keys `['stepIndex', 'selections', 'highestCompletedStepIndex']`.

**Out of scope.** Encrypting persisted state; switching storage backends.

---

## T3. 🔴 Make sale-mode dual-gate self-documenting

**Problem.** Sale rendering requires *both* `showOriginalPrice === true` and a resolvable `originalTotalPriceCents`. Today the gate is duplicated inline (ternary) on five surfaces (StickySubHeader, Overview, Floor Plan, Layout, Summary). A contributor who fixes the gate in only one place will produce inconsistent UI.

**Files**
- [apps/web/src/components/ProductConfigurator/utils.ts](../apps/web/src/components/ProductConfigurator/utils.ts) — add helper.
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](../apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx)
- [apps/web/src/components/ProductConfigurator/StickySubHeader.tsx](../apps/web/src/components/ProductConfigurator/StickySubHeader.tsx)
- [apps/web/src/components/ProductConfigurator/LayoutCard.tsx](../apps/web/src/components/ProductConfigurator/LayoutCard.tsx)

**Acceptance criteria**
1. Add a single pure helper, e.g. `isSaleModeActive(showOriginalPrice: boolean, originalCents: number | undefined): originalCents is number` (type-guard signature so TS narrows the value automatically).
2. Replace every `showOriginalPrice && state.originalTotalPriceCents !== undefined` (and equivalents) with the helper.
3. Add a unit test covering the four truth-table combinations (`true/defined`, `true/undefined`, `false/defined`, `false/undefined`).
4. No behavioural change — visual snapshots / existing integration test must continue to pass unchanged.

**Out of scope.** Restructuring the price-block JSX; moving the gate up to a context provider.

---

## T4. 🟠 Centralise the scrollable container selector

**Problem.** `useConfiguratorState.scrollToTop` hard-codes the selector `.theme-template.overflow-y-auto`. If the layout shell is ever renamed (it has been refactored before — see specs/008-garden-room-redesign), step navigation will silently stop scrolling. The CSS coupling is also undocumented at the call sites.

**Files**
- [apps/web/src/components/ProductConfigurator/useConfiguratorState.ts](../apps/web/src/components/ProductConfigurator/useConfiguratorState.ts) — `scrollToTop`.
- (Optional) [apps/web/src/components/TemplateLayout.tsx](../apps/web/src/components/TemplateLayout.tsx) — to expose a stable hook/ref.

**Acceptance criteria**
1. Extract the selector into a named constant `SCROLL_CONTAINER_SELECTOR` at the top of `useConfiguratorState.ts` with a comment pointing to the layout component that owns the class.
2. If `document.querySelector(SCROLL_CONTAINER_SELECTOR)` returns `null`, fall back to `window.scrollTo(0, 0)` (best-effort, no error). Today the helper silently no-ops.
3. Add a `console.warn('[configurator] scroll container not found; falling back to window scroll')` in dev only (`import.meta.env.DEV`).
4. Add a JSDoc note to the constant: "If `TemplateLayout` renames its scroll container class, update this selector. `window` cannot scroll because `html`/`body` have `overflow: hidden`."

**Out of scope.** Replacing the selector approach with a React ref / context (requires touching the layout component and is a larger refactor — see T9 backlog).

---

## T5. 🟠 Explicitly document and enforce the Studio-25 "no Overview" rule

**Problem.** `buildConfiguratorSteps` removes the `overview` step when `floorPlanVariants` are present. This product-shape-driven branch is invisible from the type system; new code that does `steps.find(s => s.id === 'overview')!` will crash on Studio-25.

**Files**
- [apps/web/src/components/ProductConfigurator/constants.ts](../apps/web/src/components/ProductConfigurator/constants.ts)

**Acceptance criteria**
1. Add a unit test asserting that for a product fixture with `floorPlanVariants`, the returned step array does *not* contain `overview` and *does* contain `floor-plan` and `layout` in that order.
2. Add a unit test for the converse (no `floorPlanVariants` → `overview` is present, no `floor-plan` / `layout`).
3. Add a doc comment on `buildConfiguratorSteps` explicitly stating: "Products with `floorPlanVariants` *replace* the Overview step; consumers must not assume Overview is always present."

**Out of scope.** Re-introducing Overview for Studio-25 (product decision, not engineering).

---

## T6. 🟠 Add a `data-testid` to the bottom-nav `Continue` button on Summary

**Problem.** `Continue` is intentionally hidden on the Summary step (the entire `<div className="configurator__bottom-nav">` is unmounted via `currentStep?.id !== 'summary'`). E2E tests that wait on the button without first checking the step will hang. There is currently no stable hook for "I am on the Summary step".

**Files**
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](../apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx)

**Acceptance criteria**
1. Add `data-testid="configurator-step"` and `data-step-id={currentStep?.id}` to the root `<div className="configurator">`.
2. No visual change.
3. Document the convention in [README.md §11 Accessibility / Testing](../apps/web/src/components/ProductConfigurator/README.md) with an example selector.

**Out of scope.** Writing new E2E tests; renaming existing CSS classes.

---

## T7. 🟠 Stop relying on data-side filtering for the Bathroom & Kitchen add-on

**Problem.** Whether B&K appears as an add-on is decided by manual curation in [apps/web/src/data/configurator-products.ts](../apps/web/src/data/configurator-products.ts), even though the data model carries `bathroomKitchenPolicy`. A new product that forgets to omit the add-on (or includes a duplicate) will display incorrectly.

**Files**
- [apps/web/src/components/ProductConfigurator/utils.ts](../apps/web/src/components/ProductConfigurator/utils.ts) — add `filterAddonsByPolicy(addons, policy)`.
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](../apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx) — use the filter in `renderAddonsStep`, the bespoke handler, and `submitForm`'s addon-slug builder.
- [apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx](../apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx) — same filter for the summary list.

**Acceptance criteria**
1. Add `filterAddonsByPolicy(addons, policy)` that:
   - returns `[]` when `policy === 'not-available'` and addon slug is `'bathroom'` or `'kitchen'`;
   - returns full list otherwise.
2. Apply uniformly at every site that reads `product.addons` for display **and** for total calculation.
3. Unit-test all four `(policy × addons)` combinations.
4. Verify the calculated `totalPriceCents` is unchanged for current seed data (regression safety).

**Out of scope.** Changing the data model; renaming existing slugs.

---

## T8. 🟢 Tighten Bespoke `roomSize` → API mapping with a type-level guard

**Problem.** `roomSize` is free text and must **never** be assigned to the API's strict-enum `preferredProduct` field. Today this is enforced by a comment only.

**Files**
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](../apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx) — `handleBespokeEnquiry`.

**Acceptance criteria**
1. Extract a small pure helper `buildBespokeMessage(productName, roomSize)` returning the message string. Co-locate with `handleBespokeEnquiry`.
2. The helper's signature accepts only `productName: string` and `roomSize: string | undefined` — it is structurally impossible to pass it as `preferredProduct`.
3. Unit-test: empty `roomSize` produces no `Preferred size:` clause; populated `roomSize` includes it verbatim.
4. Comment on `preferredProduct` literal: "Strict backend enum — see apps/api/src/types/submission.ts. Do NOT widen."

**Out of scope.** Changing the modal contract; widening the backend enum.

---

## T9. 🟢 Replace eager image preload with `<link rel="preload">` (or scrap it)

**Problem.** The `useEffect` in `ProductConfiguratorPage` instantiates `new Image()` for every finish image on mount. The cleanup only nulls the array — it cannot abort in-flight loads, and on slow connections this competes with the visible step's images.

**Files**
- [apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx](../apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx) — image-preloading effect.

**Acceptance criteria**
1. Either:
   - **(a)** Replace the effect with `<link rel="preload" as="image" imageSrcSet=… type="image/avif">` tags rendered into `<head>` via `react-helmet-async` (already a project dep). Browser handles cancellation.
   - **(b)** Remove the effect entirely and rely on the existing "render all images, hide via CSS" strategy already documented in §4 — measure first.
2. Decision documented in a 2–3 line PR description with a Lighthouse / network-tab before/after.
3. No functional regression on the Exterior / Interior step (images visible immediately on selection).

**Out of scope.** Changing image formats or dimensions; CDN configuration.

---

## Implementation order summary

| # | Task | Urgency | Est. effort | Depends on |
|---|---|---|---|---|
| T1 | Honeypot observability | 🔴 | XS | — |
| T2 | Persistence allow-list guard | 🔴 | XS | — |
| T3 | `isSaleModeActive` helper | 🔴 | S | — |
| T4 | Scroll-container selector constant | 🟠 | XS | — |
| T5 | Studio-25 step-builder tests | 🟠 | XS | — |
| T6 | `data-testid` on root | 🟠 | XS | — |
| T7 | `filterAddonsByPolicy` | 🟠 | S | — |
| T8 | `buildBespokeMessage` helper | 🟢 | XS | — |
| T9 | Image preload strategy review | 🟢 | M | benchmark |

**Recommended sequencing:** T1 → T2 → T3 in the same PR (state-layer hardening, ~½ day). T4–T6 can ship together as a "configurator robustness" PR. T7 standalone (touches multiple call sites; isolate the diff). T8 in any drive-by. T9 last — it requires measurement before code change.
