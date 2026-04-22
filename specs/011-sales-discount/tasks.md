# 011 — Sales / Discount — Task Breakdown

Derived from [plan.md](./plan.md). Tasks are grouped by phase (P1–P5 from §8 of the plan) and ordered so each task is independently mergeable. Each task lists its scope, files touched, and a concrete acceptance check.

Legend: `[P]` = can run in parallel with sibling tasks in the same phase. Otherwise, complete tasks sequentially within their phase.

---

## Phase P1 — Price data model

### T1.1 · Extend `Product` / `LayoutOption` types with original-price fields

- **Files:** `apps/web/src/types/garden-room.ts`
- **Do:**
  - Add `readonly originalBasePriceCentsInclVat?: number` to the `Product` interface.
  - Add `readonly originalPriceCentsInclVatByLayoutId?: Readonly<Record<string, number>>` to the `Product` interface (used by Studio 25; optional elsewhere).
  - Add JSDoc on both fields matching the wording in plan §5.2 / §5.3.1.
- **Accept:** `pnpm -w typecheck` passes with no changes in existing data files yet.

### T1.2 · Seed original prices for single-layout products

- **Files:** `apps/web/src/data/configurator-products.ts`
- **Do:** Set `originalBasePriceCentsInclVat` on the three single-layout products:
  - `compact-15` → `4_000_000`
  - `living-35` → `8_122_100`
  - `grand-45` → `10_698_100`
- **Accept:** Typecheck passes. Existing `basePriceCentsInclVat` values are untouched.

### T1.3 · Seed original prices for Studio 25 layouts (Option A)

- **Files:** `apps/web/src/data/configurator-products.ts`
- **Do:**
  - Set `originalBasePriceCentsInclVat` on `studio-25` to the "Box" value `5_800_000` (fallback).
  - Populate `originalPriceCentsInclVatByLayoutId` with:
    - `box` → `5_800_000`
    - `en-suite` → `6_588_800`
    - `bedroom` → `6_665_400`
  - Use the actual layout IDs defined on the product — verify against the file before hardcoding.
- **Accept:** Typecheck passes. Snapshot test (added in T1.5) reflects the three values.

### T1.4 · [P] Add `formatEurCentsOrUndefined` helper and project `originalPrice`

- **Files:** `apps/web/src/data/garden-room-data.ts`
- **Do:**
  - Add the helper next to the existing `formatEurCents`:
    ```ts
    function formatEurCentsOrUndefined(cents: number | undefined): string | undefined {
      return cents === undefined ? undefined : formatEurCents(cents);
    }
    ```
  - In the `PRODUCT_SHOWCASE_PRODUCTS` mapping, add `originalPrice: formatEurCentsOrUndefined(p.originalBasePriceCentsInclVat)`.
  - In the `GARDEN_ROOM_PRODUCTS` mapping, add `originalPrice: formatEurCentsOrUndefined(p.originalBasePriceCentsInclVat)`.
  - **Do not** touch `GARDEN_ROOM_QUICK_VIEW` (out of scope for v1).
- **Accept:** Typecheck passes; the new field is present in each mapped object but ignored by current consumers.

### T1.5 · [P] Unit tests for data layer

- **Files:** `apps/web/src/data/__tests__/configurator-products.test.ts`, `apps/web/src/data/__tests__/garden-room-data.test.ts` (create if missing)
- **Do:**
  - Snapshot / assertion test: Studio 25 carries all three layout originals (`box`, `en-suite`, `bedroom`) with the expected values.
  - Test `formatEurCentsOrUndefined(undefined) === undefined` and `formatEurCentsOrUndefined(4_000_000) === '€40,000'`.
  - Test that every product in `GARDEN_ROOM_PRODUCTS` carries an `originalPrice` string (as all four products now have originals).
- **Accept:** `pnpm -w test` green.

---

## Phase P2 — Promo banner

### T2.1 · Create `promo-config.ts`

- **Files:** `apps/web/src/data/promo-config.ts` (new)
- **Do:**
  - Export the `PromoConfig` interface exactly as in plan §4.2.
  - Export `PROMO_CONFIG: PromoConfig` with `enabled: false` and placeholder `name` / `endsAt` / `eyebrow`.
- **Accept:** Typecheck passes. No runtime effect.

### T2.2 · Implement `useCountdown` hook

- **Files:** `packages/ui/src/components/PromoBanner/useCountdown.ts` (new)
- **Do:**
  - Signature: `useCountdown(endsAt: string): { days: number; hours: number; minutes: number; seconds: number } | null`.
  - Returns `null` on the server, on first render pre-hydration (static placeholder elsewhere), and once `Date.now() >= new Date(endsAt).getTime()`.
  - Uses a single `setInterval(..., 1000)` that is cleared on unmount and when `endsAt` changes.
  - No external deps beyond React.
- **Accept:** Unit test (T2.4) passes.

### T2.3 · Implement `PromoBanner` component + CSS

- **Files:**
  - `packages/ui/src/components/PromoBanner/PromoBanner.tsx` (new)
  - `packages/ui/src/components/PromoBanner/PromoBanner.css` (new)
- **Do:**
  - Props per plan §4.3: `name`, `endsAt`, `eyebrow?`, `variant?: 'dark' | 'light'`, `className?`.
  - Layout: `<aside role="region" aria-label="Sale announcement">` → left eyebrow + name, right countdown.
  - Countdown segments: `DD : HH : MM : SS` on ≥ 640 px; `DD d HH h MM m` below.
  - SSR placeholder: render `-- : -- : -- : --` when hook returns `null`; banner element itself only un-renders once the hook has returned `null` on the client **and** the countdown has crossed zero (distinguish these two cases via a second effect flag).
  - BEM classes per plan §4.3.
  - `aria-live="off"` on the countdown wrapper; one summarising `aria-label` ("Sale ends in 12 days 4 hours").
  - Honour dark/light variant via CSS modifier.
- **Accept:** Story (T2.5) renders visually in Storybook for both variants.

### T2.4 · [P] Unit tests for `useCountdown` and `PromoBanner`

- **Files:** `packages/ui/src/components/PromoBanner/__tests__/PromoBanner.test.tsx`, `useCountdown.test.ts`
- **Do:**
  - `useCountdown`: fake timers; assert tick updates, zero-crossing → `null`, interval cleared on unmount.
  - `PromoBanner`: future `endsAt` renders name + countdown segments; past `endsAt` renders nothing; ssr render (via `renderToString`) contains placeholder dashes, not live numbers.
- **Accept:** All tests green.

### T2.5 · [P] Storybook stories for `PromoBanner`

- **Files:** `packages/ui/src/components/PromoBanner/PromoBanner.stories.tsx` (new)
- **Do:** Stories: `Default (dark)`, `Light`, `NearExpiry` (`endsAt` = now + 30 s), `Expired` (`endsAt` in past — asserts banner is empty).
- **Accept:** `pnpm --filter @modular-house/ui storybook` renders all four.

### T2.6 · Export `PromoBanner` from the UI package

- **Files:** `packages/ui/src/index.ts`
- **Do:** Re-export `PromoBanner` and `PromoBannerProps`.
- **Accept:** `import { PromoBanner } from '@modular-house/ui'` compiles from `apps/web`.

### T2.7 · Mount `PromoBanner` in `TemplateLayout`

- **Files:** `apps/web/src/components/TemplateLayout.tsx`
- **Do:**
  - Import `PROMO_CONFIG` and `PromoBanner`.
  - Inside `#template__header-wrapper`, immediately after `<Header ... />`, render:
    ```tsx
    {PROMO_CONFIG.enabled && (
      <PromoBanner
        name={PROMO_CONFIG.name}
        endsAt={PROMO_CONFIG.endsAt}
        eyebrow={PROMO_CONFIG.eyebrow}
        variant={config.variant}
      />
    )}
    ```
  - Verify no layout shift on `positionOver` pages (Landing, GardenRoom). If the banner hides behind the overlay header, adjust z-index / flow per plan §4.4.
- **Accept:** With `enabled=false` (default), DOM is unchanged vs. main. Temporarily flipping `enabled=true` locally shows the banner directly under the header on every route.

---

## Phase P3 — Strikethrough price display

### T3.1 · Extend `ProductRangeGrid` contract

- **Files:**
  - `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx`
  - `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.css`
- **Do:**
  - Add `originalPrice?: string` to `ProductCard`.
  - Add `showOriginalPrice?: boolean` to the component props (default `false`).
  - Render logic per plan §6.2:
    - Strikethrough branch: `<s>{originalPrice}</s>` next to `{price}`; add `product-range-card--on-sale` modifier.
    - Fallback branch (off or no `originalPrice`): visible label `"Turnkey price from"` + `{price}`.
  - Add CSS for `.product-range-card__price-old`, `.product-range-card__price-label`, `.product-range-card--on-sale`.
  - Include visually-hidden SR prefixes per plan §6.1.
- **Accept:** Component unit tests (T3.4) green.

### T3.2 · Extend `ProductShowcase` contract

- **Files:**
  - `packages/ui/src/components/ProductShowcase/ProductShowcase.tsx`
  - `packages/ui/src/components/ProductShowcase/ProductShowcase.css`
- **Do:**
  - Add `originalPrice?: string` to `ProductShowcaseProduct`.
  - Add `showOriginalPrice?: boolean` to `ProductShowcaseProps` (default `false`).
  - Render the strikethrough sibling next to the existing price; fallback branch prefixes `"Turnkey price from"`.
  - CSS hooks: `.product-showcase__price-old`, `.product-showcase__price-label`.
- **Accept:** Tests + story render both states.

### T3.3 · Extend `ProductConfigurator` price prop surface

- **Files:**
  - `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
  - `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`
  - `apps/web/src/components/ProductConfigurator/StickySubHeader.tsx`
  - `apps/web/src/components/ProductConfigurator/SummaryNavBar.tsx`
  - `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`
- **Do:**
  - Add `showOriginalPrice?: boolean` to `ProductConfiguratorPageProps` (default `false`); thread it down to `StickySubHeader` and `SummaryNavBar`.
  - In `useConfiguratorState`: compute `originalTotalPriceCents`:
    - For products with `originalPriceCentsInclVatByLayoutId`, read the map by `selections.layoutOptionId`.
    - Else use `product.originalBasePriceCentsInclVat`.
    - If neither exists, leave `undefined` (strikethrough not renderable).
    - Add the **same** addon price deltas that the live total uses.
  - `StickySubHeader` and `SummaryNavBar` accept `totalPriceCents` + optional `originalTotalPriceCents` + `showOriginalPrice`.
    - When enabled and `originalTotalPriceCents !== undefined`: render `<s>{formatPriceCents(originalTotalPriceCents)}</s>` next to the live total; no "Turnkey price from" label.
    - Otherwise: prefix the live total with visible label `"Turnkey price from"`.
  - Reuse `formatPriceCents` from `utils.ts` — no new formatter.
- **Accept:** Toggling layout on Studio 25 changes both the live total and the strikethrough in lockstep. `pnpm -w test` green.

### T3.4 · [P] Component unit + story coverage

- **Files:**
  - `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.test.tsx`
  - `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.stories.tsx`
  - `packages/ui/src/components/ProductShowcase/ProductShowcase.stories.tsx`
- **Do:**
  - Add tests: off-state shows `"Turnkey price from"` label and no `<s>` element; on-state shows `<s>{originalPrice}</s>` and no label.
  - Add a `WithStrikethrough` story per component.
  - For `ProductConfigurator`: add an integration test exercising Studio 25 layout switching with `showOriginalPrice=true`.
- **Accept:** Storybook + unit tests green.

---

## Phase P4 — Page wiring

### T4.1 · Opt `GardenRoom.tsx` into strikethrough display

- **Files:** `apps/web/src/routes/GardenRoom.tsx`
- **Do:**
  - Add a local `const SHOW_SALE_PRICES = true;` (or equivalent page-level flag) decoupled from `PROMO_CONFIG.enabled`.
  - Pass `showOriginalPrice={SHOW_SALE_PRICES}` to `ProductRangeGrid`.
  - If/when `ProductShowcase` is re-enabled in this page, pass the same prop — no other change.
- **Accept:** With `SHOW_SALE_PRICES=true`, range cards show strikethrough + sale price; with `false`, cards show `"Turnkey price from"` + sale price.

### T4.2 · Opt `GardenRoomConfigurator.tsx` into strikethrough display

- **Files:** `apps/web/src/routes/GardenRoomConfigurator.tsx`
- **Do:** Pass `showOriginalPrice` to `ProductConfiguratorPage` using the same page-level flag pattern as T4.1.
- **Accept:** Configurator sticky subheader + summary render the strikethrough when enabled, across all four products.

### T4.3 · Smoke test on preview deployment

- **Files:** none (ops task)
- **Do:** Deploy the branch to the preview environment. Walk:
  - Every top-level route → header + (optional) banner render cleanly.
  - `/garden-rooms` → range grid prices match the expected on/off state.
  - `/garden-rooms/configure/studio-25` → switch layouts; original total updates in lockstep.
- **Accept:** Marketing + engineering sign-off recorded in the PR.

---

## Phase P5 — Go / no-go

### T5.1 · Configure GTM analytics event (plan §7.3)

- **Files:** `packages/ui/src/components/PromoBanner/PromoBanner.tsx`, `apps/web/src/types/window.d.ts` (create if missing)
- **Do:**
  - Implement the `useEffect` dataLayer push described in plan §7.3 step 1.
  - Add a `Window.dataLayer` type augmentation so the push type-checks without `any`.
  - Decide on route-change re-emission per step 2 of §7.3 based on actual behaviour of `TemplateLayout`.
- **Accept:** In GTM Preview, `promo_banner_view` fires once per mount; payload contains `promo_name`, `promo_ends_at`, `page_path` only.

### T5.2 · Marketing GTM/GA4 tag setup

- **Owner:** Marketing (with engineering support)
- **Do:** Create a GA4 event tag in GTM triggered on `promo_banner_view`, mapping the three payload keys to GA4 event parameters. Publish the tag.
- **Accept:** GA4 DebugView shows the event with the correct parameters from a preview visit.

### T5.3 · Enable the campaign in production

- **Files:** `apps/web/src/data/promo-config.ts`
- **Do:**
  - Set `enabled: true`.
  - Update `name`, `endsAt` (with correct timezone offset), and `eyebrow` to campaign copy.
  - Merge and deploy.
- **Accept:** Production shows the banner with a live countdown under the header on every route. Countdown self-hides at the configured `endsAt`.

### T5.4 · Post-launch validation

- **Files:** none
- **Do:**
  - Verify Lighthouse Performance + Accessibility scores for `/` and `/garden-rooms` have not regressed vs. the pre-launch baseline.
  - Check GA4 for at least one live `promo_banner_view` event.
  - Confirm the banner disappears automatically at `endsAt` without a deploy.
- **Accept:** All three checks pass; campaign recorded as live.

---

## Cross-cutting / housekeeping (any phase)

### TX.1 · Dev-only stale-`endsAt` warning

- **Files:** `apps/web/src/data/promo-config.ts` (or `PromoBanner.tsx`)
- **Do:** When `import.meta.env.DEV` and `enabled === true && new Date(endsAt) <= new Date()`, emit a single `console.warn` pointing at the config file.
- **Accept:** Running `pnpm --filter web dev` with a past `endsAt` logs the warning exactly once.

### TX.2 · Documentation touch-up

- **Files:** `CLAUDE.md` (Active Technologies or Recent Changes section only)
- **Do:** Add a single line entry referencing this feature (`011-sales-discount: PromoBanner + strikethrough pricing primitives`).
- **Accept:** File unchanged elsewhere.
