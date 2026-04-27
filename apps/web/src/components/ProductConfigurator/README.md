# ProductConfigurator

Multi-step, session-persisted product configurator for Modular House garden rooms. Guides a customer through floor-plan / layout / finish / add-on selection, calculates a live VAT-inclusive total (with optional sale-mode strikethrough pricing), and submits a consultation enquiry to the API.

> Location: [apps/web/src/components/ProductConfigurator](.)
> Public entry: [`ProductConfiguratorPage`](./ProductConfiguratorPage.tsx) — re-exported from [index.ts](./index.ts)
> Mounted by route: [apps/web/src/routes/GardenRoomConfigurator.tsx](../../routes/GardenRoomConfigurator.tsx) at `/garden-rooms/configure/:slug`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Public API](#2-public-api)
3. [File Map](#3-file-map)
4. [Step Sequence](#4-step-sequence)
5. [State & Persistence](#5-state--persistence)
6. [Pricing Model](#6-pricing-model)
7. [Sale-Mode (Strikethrough) Pricing](#7-sale-mode-strikethrough-pricing)
8. [Form Submission Flow](#8-form-submission-flow)
9. [Floor-Plan Rendering Modes](#9-floor-plan-rendering-modes)
10. [Styling & Animation](#10-styling--animation)
11. [Accessibility](#11-accessibility)
12. [Testing](#12-testing)
13. [Extension Guide](#13-extension-guide)
14. [Gotchas](#14-gotchas)

---

## 1. Overview

The `ProductConfigurator` is a self-contained component tree that renders a stepped configuration UI for a single `ConfiguratorProduct` (resolved from the URL slug by the parent route). It is fully presentational at its boundary — all data is supplied via props — and delegates state, persistence, and pricing to the [`useConfiguratorState`](./useConfiguratorState.ts) hook.

**Architecture in one line:** *Route resolves product → page passes product to `ProductConfiguratorPage` → page reads/writes state via `useConfiguratorState` → step renderers compose presentational sub-components.*

```
GardenRoomConfigurator (route)
        │ product, showOriginalPrice, *PriceLabel
        ▼
ProductConfiguratorPage  ────────────────────────────────
        │                                                 \
        │ uses                                              \ renders
        ▼                                                    ▼
useConfiguratorState                              StickySubHeader
        │                                         ProgressBar
        │ persists to                             FinishCard / AddonCard /
        ▼                                         FloorPlanCard / LayoutCard
sessionStorage[`configurator-state:<slug>`]      FloorPlan / ArchitecturalFloorPlan
                                                  SummaryNavBar / BespokeHint
```

---

## 2. Public API

```tsx
import { ProductConfiguratorPage } from '@/components/ProductConfigurator';

<ProductConfiguratorPage
  product={resolvedProduct}            // ConfiguratorProduct (required)
  showOriginalPrice={false}            // optional, default false
  originalPriceLabel="Original price"  // optional, default 'Original price'
  salePriceLabel="Sale price"          // optional, default 'Sale price'
/>
```

| Prop | Type | Default | Purpose |
|---|---|---|---|
| `product` | `ConfiguratorProduct` | — | Fully-resolved product (see [apps/web/src/types/configurator.ts](../../types/configurator.ts)). |
| `showOriginalPrice` | `boolean` | `false` | Opt-in to sale-mode strikethrough rendering. Effective only when the product also carries an `originalBasePriceCentsInclVat` or `originalPriceCentsInclVatByLayoutId` entry. |
| `originalPriceLabel` | `string` | `'Original price'` | Label rendered next to the struck-through price in sale mode. |
| `salePriceLabel` | `string` | `'Sale price'` | Label rendered next to the live total in sale mode. |

The barrel ([index.ts](./index.ts)) also re-exports the `ConfiguratorStepId` and `ConfiguratorSelections` types.

---

## 3. File Map

| File | Role |
|---|---|
| [ProductConfiguratorPage.tsx](./ProductConfiguratorPage.tsx) | Top-level component. Owns step rendering, scroll-to-top, image preloading, and the bespoke-enquiry handler. |
| [useConfiguratorState.ts](./useConfiguratorState.ts) | All state, navigation, validation, persistence, pricing, and form submission. |
| [types.ts](./types.ts) | Local UI state types (`ConfiguratorStepId`, `ConfiguratorSelections`, `ConfiguratorFormData`, `FormStatus`, `DatePreferenceValue`). Distinct from the data-model types in [`types/configurator.ts`](../../types/configurator.ts). |
| [constants.ts](./constants.ts) | `BASE_STEPS`, `buildConfiguratorSteps()`, default finish names, `SESSION_STORAGE_KEY_PREFIX`. |
| [utils.ts](./utils.ts) | `formatPriceCents`, `calculateTotalPriceCents`, `resolveDefaultFinishId`, `buildDefaultSelections`. |
| [ProgressBar.tsx](./ProgressBar.tsx) | Numbered/checkmark step indicator. Clickable for already-completed steps. |
| [StickySubHeader.tsx](./StickySubHeader.tsx) | Apple-style sticky header showing product name + total (default or sale layout). |
| [SummaryNavBar.tsx](./SummaryNavBar.tsx) | Stacked summary cards on the Summary step (floor plan, finishes, glazing, B&K, addons…). |
| [FinishCard.tsx](./FinishCard.tsx) | Selectable finish swatch (radial-gradient circle + label). |
| [AddonCard.tsx](./AddonCard.tsx) | Toggleable add-on card (icon, name, description, price, checkbox). |
| [AddonIcon.tsx](./AddonIcon.tsx) | `AddonIconId` → SVG icon lookup map. |
| [FloorPlanCard.tsx](./FloorPlanCard.tsx) | Compact selection card for a floor-plan footprint. |
| [LayoutCard.tsx](./LayoutCard.tsx) | Compact card for an interior layout tier (Box / En Suite / Bedroom), with feature badges and per-card sale price. |
| [FloorPlan.tsx](./FloorPlan.tsx) | Lightweight 260×260 SVG floor plan (used for products without an architectural config). |
| [ArchitecturalFloorPlan.tsx](./ArchitecturalFloorPlan.tsx) | Data-driven architectural-quality SVG (double walls, dim lines, swing arcs, zone labels). |
| [BespokeHint.tsx](./BespokeHint.tsx) | Subtle "design something fully bespoke" prompt below the Summary CTA; opens shared `EnquiryFormModal`. |
| [ProductConfigurator.css](./ProductConfigurator.css) | All styling and animations for the component tree (~63 KB). |
| [\_\_tests\_\_/](./__tests__) | Vitest integration tests. |

---

## 4. Step Sequence

Steps are computed at runtime by [`buildConfiguratorSteps(product)`](./constants.ts) based on optional product fields:

| Step ID | Always present? | Trigger |
|---|---|---|
| `floor-plan` | No | `product.floorPlanVariants?.length > 0` |
| `layout` | No | `product.layoutOptions?.length > 0` |
| `overview` | Yes (skipped when `floorPlanVariants` exist) | Base sequence |
| `exterior` | Yes | Base sequence |
| `interior` | Yes | Base sequence |
| `addons` | Yes | Base sequence |
| `summary` | Yes | Base sequence |

**Examples:**

- Compact 15 / Living 35 / Grand 45 → `Overview → Exterior → Interior → Add-ons → Summary` (5 steps).
- Studio 25 → `Floor Plan → Layout → Exterior → Interior → Add-ons → Summary` (6 steps; the Overview step is intentionally dropped because Floor Plan + Layout already introduce the product).

The current step's content is selected by a switch in `renderStepContent()` inside [ProductConfiguratorPage.tsx](./ProductConfiguratorPage.tsx).

### Per-step behaviour

| Step | Hero area | Card row | Validation (`canProceed`) |
|---|---|---|---|
| Floor Plan | All variant visuals rendered together; hidden via CSS class | `FloorPlanCard` per variant | `floorPlanVariantId !== null` |
| Layout | All layout SVGs rendered together; hidden via CSS class | `LayoutCard` per option | `layoutOptionId !== null` |
| Overview | Floor plan image / `FloorPlan` / `ArchitecturalFloorPlan` + price block | Specs grid + included features + glazing details | always `true` |
| Exterior | All finish images rendered together; visibility toggled | `FinishCard` per option | `exteriorFinishId !== null` |
| Interior | Same as Exterior, for interior options | `FinishCard` per option | `interiorFinishId !== null` |
| Add-ons | — | `AddonCard` per addon + running total | always `true` |
| Summary | `SummaryNavBar` | Price breakdown, CTA, `BespokeHint` | always `false` (terminal) |

> **Why are all hero images mounted simultaneously?** Switching `<img>` mount on selection re-triggers the load + intro animation and causes visible jitter. CSS visibility toggling (`--active` / `--hidden`) keeps the DOM stable. A `useEffect` in `ProductConfiguratorPage` also pre-creates `Image` objects for every finish on mount to warm the browser cache.

---

## 5. State & Persistence

`useConfiguratorState(product)` returns a single API object — see the [`ConfiguratorStateAPI`](./useConfiguratorState.ts) interface for the full surface.

**Persisted to `sessionStorage`** under the key `configurator-state:<slug>`:

```ts
{
  stepIndex: number;
  selections: ConfiguratorSelections;
  highestCompletedStepIndex: number;
}
```

**NOT persisted** (intentionally fresh per page load): `formData`, `formStatus`, `quoteNumber`, `formError`, `formValidationErrors`, `animationKey`, `showConsultation`.

### Selection defaults

[`buildDefaultSelections`](./utils.ts) seeds the initial state on first load:

- First `floorPlanVariant` (if any).
- First `layoutOption` (if any).
- Exterior finish whose name matches `DEFAULT_EXTERIOR_FINISH_NAME` (`'Charcoal'`).
- Interior finish whose name matches `DEFAULT_INTERIOR_FINISH_NAME` (`'Matt'`).
- `selectedAddonIds: []`.

If a session already exists, persisted selections are merged on top of `EMPTY_SELECTIONS` (forward compatibility for newly-added fields).

### Navigation rules

- `nextStep()` advances only when `canProceed === true`; updates `highestCompletedStepIndex` monotonically.
- `previousStep()` decrements freely.
- `goToStep(index)` is allowed only when `index <= highestCompletedStepIndex` AND `formStatus !== 'success'` (the success screen is a terminal state).
- Each navigation increments `animationKey`, which is the React `key` on the content container — re-keying forces a remount and replays the fade-up animation.
- After every navigation, `scrollToTop()` scrolls the `.theme-template.overflow-y-auto` container (the app uses an internal scroll container; `window.scrollTo` does not work here).

---

## 6. Pricing Model

All prices are stored as **integer euro cents inclusive of VAT** to avoid float precision issues. Display uses [`formatPriceCents`](./utils.ts) with the `en-IE` locale.

`totalPriceCents = base + Σ(selected addons) + floorPlanVariantDelta + layoutOptionDelta`

Implemented in [`calculateTotalPriceCents`](./utils.ts). Called once per render from `useConfiguratorState`; the result is exposed as `state.totalPriceCents`.

---

## 7. Sale-Mode (Strikethrough) Pricing

Introduced by feature `011-sales-discount`. Renders a comparison block (`Original price` strikethrough + `Sale price` live) on:

- `StickySubHeader`
- Overview step hero price block
- Floor Plan step price block (per-variant)
- Layout step `LayoutCard` (per layout)
- Summary step price-breakdown total

### Activation rule (must satisfy **both**)

1. The page passes `showOriginalPrice={true}` (driven on the live route by `PROMO_CONFIG.enabled` in [GardenRoomConfigurator.tsx](../../routes/GardenRoomConfigurator.tsx)).
2. An original base resolves to a defined number (see lookup order below).

If either is missing, every surface gracefully falls back to the standard single-price layout — products without seeded originals are safe.

### Original-base lookup order

1. `product.originalPriceCentsInclVatByLayoutId[selections.layoutOptionId]` (per-layout map; used by Studio 25 where each layout has its own pre-sale base).
2. `product.originalBasePriceCentsInclVat` (scalar fallback for single-base products).
3. `undefined` → suppress.

`originalTotalPriceCents` is computed by feeding the resolved base through the same `calculateTotalPriceCents` pipeline so add-on / variant / layout deltas are identical pre- and post-sale (the discount applies to the base only).

---

## 8. Form Submission Flow

The consultation form lives on the Summary step and is shown when the user clicks the primary CTA (`state.setShowConsultation(true)`).

```
idle ──submitForm()──▶ submitting ──▶ success ──▶ (terminal: confirmation screen)
                            │
                            └─────▶ error  ──retry──▶ submitting
```

### Steps performed by `submitForm()`

1. Run [`validateFormData`](./useConfiguratorState.ts) (firstName / email / phone / eircode / conditional selectedDate). Errors map to `formValidationErrors`.
2. **Honeypot:** if `formData.honeypot !== ''`, fake a successful response (`HONEYPOT_FAKE_QUOTE_NUMBER`, currently `Q0000000`) and return — no API request issued, but a single structured `console.warn` is emitted for operator visibility. This denies bots feedback that they were rejected.
3. Resolve preferred date (`'asap'` literal or ISO date string).
4. Resolve selected exterior / interior finish names, comma-joined add-on slugs, optional floor-plan / layout slugs.
5. POST to `apiClient.submitEnquiry({ … sourcePage: 'configurator', … })`.
6. On success → store `quoteNumber`, transition to `'success'` (renders `renderConfirmationScreen`).
7. On error → store `err.message`, transition to `'error'`.

### BespokeHint (parallel flow)

`BespokeHint` opens the shared `EnquiryFormModal` from `@modular-house/ui`. Its submission is handled by the `handleBespokeEnquiry` callback in `ProductConfiguratorPage`, which posts to the same `apiClient.submitEnquiry` but with `sourcePage: 'bespoke'` and the configurator context (product slug, finishes, addons, total) attached. Note: the modal's free-text `roomSize` is appended to the message and **never** mapped to `preferredProduct` (the API enum is strict).

---

## 9. Floor-Plan Rendering Modes

Three rendering paths exist; the right one is chosen at runtime:

| Mode | Used when | Component |
|---|---|---|
| **Pre-rendered SVG image** | Any variant has `floorPlanImagePath` or a layout-keyed entry in `floorPlanImagesByLayout` | `<img>` (no React component) |
| **Architectural** (programmatic) | Variant lacks an image path (currently Studio 25) | [`ArchitecturalFloorPlan`](./ArchitecturalFloorPlan.tsx) with config from [`getStudioFloorPlanConfig`](../../data/studio-floor-plans.ts) |
| **Lightweight 260×260** | Product has only the legacy `floorPlan` field and no variants | [`FloorPlan`](./FloorPlan.tsx) |

`ArchitecturalFloorPlan` is data-driven (no hard-coded geometry). It scales 1 mm = 0.1 SVG units, computes the viewBox from outer dimensions + padding, and renders 12 layered passes (inner fill → outer wall → inner wall → corner posts → exterior apertures → labels → exterior dim lines → interior dim lines → north arrow → zone labels → internal walls → internal dim annotations).

---

## 10. Styling & Animation

- All styles live in [ProductConfigurator.css](./ProductConfigurator.css). Class names follow BEM under the `configurator__` prefix.
- Step transitions use a `configurator-fade-up` keyframe; replayed by re-keying the content container with `animationKey`.
- The confirmation screen has a bespoke checkmark animation (circle scales in, path stroke draws).
- Sale-mode rows use the modifiers `--original` / `--sale` and the group modifier `--on-sale` on the breakdown total.

---

## 11. Accessibility

- All cards (`FinishCard`, `AddonCard`, `FloorPlanCard`, `LayoutCard`) are real `<button>` elements with `aria-pressed`.
- `ProgressBar` step nodes use `aria-current="step"` on the active step and `aria-disabled` on unreachable steps.
- The honeypot field is wrapped in `aria-hidden="true"` with `tabIndex={-1}` and is positioned off-screen via CSS.
- Error messages on form fields use a dedicated `configurator__form-field-error` element rendered immediately after the input; the form-level error uses `role="alert"`.
- All decorative SVGs (checkmarks, addon icons, animated check) carry `aria-hidden="true"`.

### Stable test hooks

The configurator root exposes two attributes for E2E selectors that remain stable across CSS refactors:

- `data-testid="configurator-step"` — anchor for locating the configurator shell.
- `data-step-id="<step-id>"` — current step id (`overview`, `floor-plan`, `layout`, `exterior`, `interior`, `addons`, `summary`).

Recommended selector pattern. Tests must assert the expected step before waiting on step-specific controls — the bottom-nav `Continue` button, for example, is unmounted on the Summary step and any wait that ignores the step id will hang:

```ts
// Playwright
await page.locator('[data-testid="configurator-step"][data-step-id="addons"]').waitFor();
await page.getByRole('button', { name: /Review Configuration/ }).click();
```

---

## 12. Testing

```
__tests__/useConfiguratorState.originalTotal.test.ts
```

Integration test (Vitest + `@testing-library/react`) that renders the hook with the real Studio 25 seed and asserts that both the live total and the original total track the layout deltas across all three layouts. Run from the workspace:

```powershell
pnpm --filter web test
# or, for this file alone:
pnpm --filter web test -- ProductConfigurator
```

---

## 13. Extension Guide

### Add a new product
Add a `ConfiguratorProduct` to [`apps/web/src/data/configurator-products.ts`](../../data/configurator-products.ts). No component changes required. Steps are computed automatically; supply `floorPlanVariants` / `layoutOptions` only if the product needs them.

### Add a new add-on icon
1. Append the new id to the `AddonIconId` union in [`types/configurator.ts`](../../types/configurator.ts).
2. Create a new 24×24 SVG component in [AddonIcon.tsx](./AddonIcon.tsx) using `currentColor`.
3. Register it in `ICON_MAP`.

### Add a new step
1. Add the id to `ConfiguratorStepId` in [types.ts](./types.ts).
2. Push a `ConfiguratorStep` entry into `BASE_STEPS` (or branch on a product field inside `buildConfiguratorSteps`).
3. Add a `case` in the `canProceed` switch and the `renderStepContent` switch.
4. Implement a `renderXxxStep()` function in `ProductConfiguratorPage`.

### Toggle the sale on/off
Flip `PROMO_CONFIG.enabled` in [`apps/web/src/data/promo-config.ts`](../../data/promo-config.ts). To customise the strikethrough labels, edit `PROMO_CONFIG.priceLabels.original` / `.sale`.

### Add a summary section
Add a render function to [SummaryNavBar.tsx](./SummaryNavBar.tsx) and call it from the component's JSX. Existing renderers stay untouched (Open-Closed).

---

## 14. Gotchas

- **Scroll container.** `window.scrollTo` does not work — `html` and `body` have `overflow: hidden`. Always scroll `.theme-template.overflow-y-auto`.
- **`canProceed` on Summary is `false`** — the bottom-nav `Continue` button is hidden on the Summary step (`currentStep?.id !== 'summary'` guard), so this is expected and prevents stepping past the terminal step.
- **Studio 25 has no Overview step.** `buildConfiguratorSteps` removes it because Floor Plan + Layout already introduce the product. Any "always show overview" assumption will break.
- **Add-on filtering by B&K policy is data-side.** The configurator does not filter add-ons by `bathroomKitchenPolicy`; that is handled in the seed data (Bathroom + Kitchen appear as add-ons only on the 25 m² product). Don't re-filter in the UI.
- **Honeypot fakes success.** A populated honeypot returns the `HONEYPOT_FAKE_QUOTE_NUMBER` constant (`Q0000000`, exported from `useConfiguratorState.ts`) without an API call, and emits a single `console.warn('[configurator] honeypot triggered', { slug, ts })` for operator visibility (no PII). Be careful when debugging — a "successful" submission with quote `Q0000000` indicates spam-detection, not a real request.
- **`showOriginalPrice={true}` alone is not enough.** Sale rendering requires both the flag and a resolvable original base; otherwise components silently fall back. This is intentional — it makes the flag safe to enable globally even for products without seeded originals.
- **Image preloading on mount** dereferences images on cleanup but does not abort in-flight loads. Acceptable because the URL set is small and stable.
- **`formData` is intentionally not persisted.** The form starts fresh on every page load by design (privacy + avoiding stale errors). Don't add it to `PersistedState` without product sign-off.
- **Bespoke enquiry `roomSize`** is *not* the API's `preferredProduct`. The latter is a strict enum (`'Garden Room' | 'House Extension'`); `roomSize` is appended to the message string instead.
