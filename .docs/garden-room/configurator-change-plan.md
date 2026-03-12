# Garden Room Configurator -- Change Request Action Plan

**Created:** 2026-03-12
**Source:** `.template/garden-room/change-request.md`
**Status:** Planning

---

## Overview

This document breaks the configurator change request into three workstreams (A, B, C) containing small, individually implementable tasks. Each task has a clear scope, lists the files it touches, and describes the expected outcome.

---

## Workstream A -- SEO & UI Polish (Frontend Only)

These tasks address page metadata, bottom nav scrolling, and step navigation behaviour.

### Task A1: Add SEO metadata to configurator route

**Scope:** Add `<title>`, `<meta description>`, Open Graph, Twitter Card, canonical URL, and robots tags to each configurator page. Because the route is dynamic (`:slug`), the metadata must be injected at the component level rather than via `routes-metadata.ts`.

**Files to modify:**
- `apps/web/src/routes/GardenRoomConfigurator.tsx`

**What to do:**
1. Import `Seo` from `@modular-house/ui` and `BUILD_TIMESTAMP` from `../build-timestamp`.
2. Inside the component, after resolving the `product` from the slug, render a `<Seo>` component with:
   - `title`: `"Configure Your {product.name} | Modular House"` (e.g., "Configure Your The Studio | Modular House")
   - `description`: `"{product.name} {product.dimensions.areaM2}m² steel frame garden room configurator. Choose finishes, add-ons, and get your instant estimate."`
   - `canonicalUrl`: `"https://modularhouse.ie/garden-room/configure/{product.slug}"`
   - `robots`: `"index, follow"`
   - `openGraph`: type `"website"`, image from `product.image.src` (absolute URL with `https://modularhouse.ie` prefix), url matching canonical
   - `twitter`: `summary_large_image` card, site `"@ModularHouse"`, same image
   - No JSON-LD schema is needed for this page at this stage.
3. Pass `siteTitleSuffix=""` since the title already includes `"| Modular House"`.

**Acceptance criteria:** Each of the four configurator URLs (`/garden-room/configure/compact-15`, `/studio-25`, `/living-35`, `/grand-45`) renders unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and OG/Twitter tags in the document `<head>`.

---

### Task A2: Constrain bottom nav bar to stop at the page footer

**Scope:** The fixed bottom navigation bar currently sticks to the viewport bottom regardless of scroll position. It must stop scrolling (become static) once it reaches the page footer, so it never overlaps the footer.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
- `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`

**What to do:**
1. In `ProductConfiguratorPage.tsx`, add a `useRef` for the bottom nav element and a `useRef` for a sentinel `<div>` placed just above the footer (or at the bottom of the `.configurator` container).
2. Use an `IntersectionObserver` to detect when the sentinel enters the viewport:
   - When the sentinel is **not** visible (user is scrolled above the footer): bottom nav stays `position: fixed; bottom: 0`.
   - When the sentinel **is** visible (user has scrolled to the bottom / footer is visible): switch bottom nav to `position: static` (or `position: absolute; bottom: 0` relative to the configurator container).
3. Alternative simpler approach: wrap the entire configurator (including bottom nav) in a relatively-positioned container and give the bottom nav `position: sticky; bottom: 0` instead of `position: fixed`. This naturally stops the element at the container boundary without JavaScript.
4. In the CSS file, change `.configurator__bottom-nav` from `position: fixed` to `position: sticky` and remove `left: 0; right: 0;`. Add the max-width and centering styles directly.

**Acceptance criteria:** When the user scrolls to the bottom of the configurator page, the bottom navigation bar stops at the footer boundary and does not overlap or float over the footer.

---

### Task A3: Preserve all completed step highlights during backward navigation

**Scope:** Currently, navigating to a previous step resets the progress bar so only steps up to the current index show as completed. The requirement is that all steps the user has ever completed remain highlighted and navigable, even when viewing an earlier step.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`
- `apps/web/src/components/ProductConfigurator/ProgressBar.tsx`
- `apps/web/src/components/ProductConfigurator/types.ts`

**What to do:**
1. In `types.ts`, add a new field to the persisted state: `highestCompletedStepIndex: number` (default `0`).
2. In `useConfiguratorState.ts`:
   - Add a `highestCompletedStepIndex` state variable, initialised from sessionStorage or `0`.
   - When `nextStep()` is called, update `highestCompletedStepIndex` to `Math.max(highestCompletedStepIndex, newStepIndex)`.
   - Expose `highestCompletedStepIndex` in the returned API.
   - Persist `highestCompletedStepIndex` to sessionStorage alongside `stepIndex` and `selections`.
   - In `goToStep()`, remove the `if (index < stepIndex)` guard and replace it with `if (index <= highestCompletedStepIndex)` -- this allows forward navigation to any previously visited step.
3. In `ProgressBar.tsx`:
   - Change the `isCompleted` logic from `index < currentStepIndex` to `index <= highestCompletedStepIndex && index !== currentStepIndex`.
   - Change the `isClickable` logic from `isCompleted` (i.e., `index < currentStepIndex`) to `index <= highestCompletedStepIndex && index !== currentStepIndex`.

**Acceptance criteria:** After reaching step 4 (summary) and navigating back to step 1 (exterior), steps 2, 3, and 4 remain highlighted with checkmarks and are clickable in the progress bar. Clicking step 4 navigates directly to the summary without needing to re-advance through steps 2 and 3.

---

## Workstream B -- Configurator Form Enhancements (Frontend)

These tasks modify the consultation form that appears on the summary step.

### Task B1: Add Eircode field after Mobile

**Scope:** Insert an "Eircode" text input field between the "Mobile" and "Preferred Date" fields.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`

**What to do:**
1. In `renderConsultationForm()`, add a new `<div>` block after the Mobile field (`cfg-phone`) and before the Preferred Date field (`cfg-date`):
   ```tsx
   <div>
     <label className="configurator__form-label" htmlFor="cfg-eircode">Eircode</label>
     <input
       id="cfg-eircode"
       type="text"
       placeholder="D22 X0C7"
       className="configurator__form-input"
       autoComplete="postal-code"
     />
   </div>
   ```
2. Later (Task B7), this field will be wired to form state. For now it is a presentational-only field.

**Acceptance criteria:** The form displays First Name, Email, Mobile, **Eircode**, Preferred Date, Message in that order.

---

### Task B2: Replace Preferred Date with dropdown + conditional date picker

**Scope:** Replace the plain `<input type="date">` with a dropdown (`<select>`) containing "As Soon As Possible" and "Select Date" options. If "Select Date" is chosen, a date picker input appears below the dropdown.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
- `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`

**What to do:**
1. In `ProductConfiguratorPage.tsx`, replace the Preferred Date `<input type="date">` block with:
   ```tsx
   <div>
     <label className="configurator__form-label" htmlFor="cfg-date-preference">Preferred Date</label>
     <select id="cfg-date-preference" className="configurator__form-input">
       <option value="asap">As Soon As Possible</option>
       <option value="select-date">Select Date</option>
     </select>
   </div>
   ```
2. Add local state (`useState`) to track whether the user selected "select-date".
3. Conditionally render a date picker input below the dropdown when "Select Date" is chosen:
   ```tsx
   {datePreference === 'select-date' && (
     <div>
       <label className="configurator__form-label" htmlFor="cfg-date">Select your preferred date</label>
       <input id="cfg-date" type="date" className="configurator__form-input" />
     </div>
   )}
   ```
4. In the CSS file, add styles for `<select>` elements to match the existing input styling (`.configurator__form-input` already covers most of it, but add `appearance: none` and a custom dropdown arrow for consistency).

**Note on Tailwind:** The change request mentions "Tailwind date picker box". Since the project uses plain CSS (not Tailwind in the web app), the date picker will use the native `<input type="date">` styled with the existing configurator CSS classes. This provides a clean, consistent appearance without adding a Tailwind dependency to the web app.

**Acceptance criteria:** The Preferred Date section shows a dropdown with two options. Selecting "As Soon As Possible" hides the date picker. Selecting "Select Date" reveals a date input below the dropdown.

---

### Task B3: Update the bottom configuration summary message

**Scope:** Change the summary message in the consultation form from displaying finish names and addon list to a simpler format showing: Product Name, Dimensions, Exterior Finish, Interior Finish.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`

**What to do:**
1. In `renderConsultationForm()`, replace the existing `configurator__form-summary` div content with:
   ```tsx
   <div className="configurator__form-summary">
     Your configuration: <strong>{product.name}</strong>,{' '}
     {product.dimensions.widthM}m x {product.dimensions.depthM}m,{' '}
     <strong>{selectedExterior?.name ?? 'No exterior'}</strong>,{' '}
     <strong>{selectedInterior?.name ?? 'No interior'}</strong>
   </div>
   ```
2. Remove the add-ons list and the price from the summary message.

**Acceptance criteria:** The summary message reads (example): "Your configuration: **The Studio**, 5m x 5m, **Black**, **Stone**"

---

### Task B4: Add honeypot field to configurator form

**Scope:** Add a hidden anti-spam honeypot question: "What is the last 4 letters of SIEHTAWA?" (answer: "TAWA"). If the user fills it in with anything other than "TAWA" (or leaves it as the default empty state), the submission is silently rejected with a fake success response.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
- `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`

**What to do:**
1. In `renderConsultationForm()`, add a hidden field after the Message textarea and before the summary div:
   ```tsx
   <div className="configurator__form-honeypot" aria-hidden="true">
     <label htmlFor="cfg-security">What is the last 4 letters of SIEHTAWA?</label>
     <input
       id="cfg-security"
       type="text"
       tabIndex={-1}
       autoComplete="off"
     />
   </div>
   ```
2. In the CSS file, add:
   ```css
   .configurator__form-honeypot {
     position: absolute;
     left: -9999px;
     opacity: 0;
     height: 0;
     overflow: hidden;
     pointer-events: none;
   }
   ```
3. The validation logic will be wired in Task B7 when the form state management is implemented.

**Acceptance criteria:** The honeypot field is invisible to regular users but visible to bots. Screen readers skip it via `aria-hidden="true"`.

---

### Task B5: Build Apple-style confirmation screen

**Scope:** After the user clicks "Submit", replace the form with a success confirmation screen featuring an animated checkmark, a thank-you message, and a "Back to Home" button.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
- `apps/web/src/components/ProductConfigurator/ProductConfigurator.css`
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`

**What to do:**
1. In `useConfiguratorState.ts`:
   - Add a new state: `formStatus: 'idle' | 'submitting' | 'success' | 'error'` (default `'idle'`).
   - Expose `formStatus` and `setFormStatus` in the returned API.

2. In `ProductConfiguratorPage.tsx`:
   - Add a new `renderConfirmationScreen()` function that renders:
     - An animated checkmark SVG (circle with checkmark that draws in with CSS animation)
     - Heading: "Your estimate is on its way"
     - Subtitle: "Check your inbox -- your personalised estimate will arrive within 30 seconds."
     - Quote number display (received from API response, or placeholder)
     - "Back to Home" link using React Router's `<Link to="/">` styled as a pill button
   - In `renderStepContent()`, add a condition: if `state.formStatus === 'success'`, render `renderConfirmationScreen()` instead of the consultation form.

3. In the CSS file, add:
   - `.configurator__confirmation` -- centred container with padding
   - `.configurator__checkmark-circle` -- animated SVG container (scale-in + draw animation)
   - `.configurator__confirmation-title` -- heading style (Instrument Serif, 28px)
   - `.configurator__confirmation-subtitle` -- muted text (DM Sans, 15px)
   - `.configurator__confirmation-quote` -- quote number badge
   - `.configurator__home-link` -- Apple-style pill button (dark bg, white text, rounded)
   - Keyframe `@keyframes draw-checkmark` for the SVG stroke animation
   - Keyframe `@keyframes scale-in-circle` for the circle entrance

**Acceptance criteria:** After successful form submission, the form is replaced by an animated checkmark, a thank-you message with the quote number, and a "Back to Home" button. The confirmation screen cannot be navigated away from by clicking progress bar steps.

---

### Task B6: Wire up configurator form state management

**Scope:** The form fields are currently uncontrolled (no state, no submission logic). Wire them to React state, add validation, connect to `apiClient.submitEnquiry()`, and integrate the honeypot + confirmation screen.

**Files to modify:**
- `apps/web/src/components/ProductConfigurator/ProductConfiguratorPage.tsx`
- `apps/web/src/components/ProductConfigurator/useConfiguratorState.ts`
- `apps/web/src/components/ProductConfigurator/types.ts`

**What to do:**
1. In `types.ts`, define a `ConfiguratorFormData` interface:
   ```ts
   interface ConfiguratorFormData {
     firstName: string;
     email: string;
     phone: string;
     eircode: string;
     datePreference: 'asap' | 'select-date';
     selectedDate: string;
     message: string;
     honeypot: string;
   }
   ```

2. In `useConfiguratorState.ts`:
   - Add `formData: ConfiguratorFormData` state (initialise all fields to empty strings, `datePreference` to `'asap'`).
   - Add `formStatus` state (`'idle' | 'submitting' | 'success' | 'error'`).
   - Add `quoteNumber: string` state (empty by default, populated on success).
   - Add `formError: string` state for displaying error messages.
   - Add `updateFormField(field, value)` function.
   - Add `submitForm(product, selections)` async function that:
     a. Validates required fields (firstName, email, phone, eircode).
     b. Checks honeypot: if `honeypot` is not empty, silently set `formStatus = 'success'` without sending (fake success).
     c. Sets `formStatus = 'submitting'`.
     d. Calls `apiClient.submitEnquiry()` with the mapped payload (include `sourcePageSlug: 'garden-room-configurator'`).
     e. On success: sets `formStatus = 'success'`, stores returned `quoteNumber`.
     f. On error: sets `formStatus = 'error'`, stores error message.
   - Expose all new state and functions in the returned API.

3. In `ProductConfiguratorPage.tsx`:
   - Wire all form `<input>` elements to `state.formData` via `value` and `onChange` that calls `state.updateFormField()`.
   - Wire the "Submit" button to call `state.submitForm(product, state.selections)`.
   - Show loading state on submit button when `formStatus === 'submitting'`.
   - Show error message when `formStatus === 'error'`.
   - Render confirmation screen when `formStatus === 'success'`.

**Acceptance criteria:** All form fields are controlled. Submitting the form sends data to the API, shows a loading indicator, and transitions to the confirmation screen on success. The honeypot silently rejects bots. Validation errors are displayed inline.

---

## Workstream C -- Backend: Database, Quote Generation, & Emails

These tasks modify the API backend to handle configurator submissions, generate quotes, and send branded emails.

### Task C1: Extend the database schema for configurator submissions

**Scope:** The existing `Customer` table and submission flow need to be extended to track which page a submission came from and to store configurator-specific data (selected product, finishes, add-ons).

**Files to modify:**
- `apps/api/prisma/schema.prisma`

**What to do:**
1. Review the existing `Customer` model and `Submission` model.
2. Add a `sourcePage` field to the `Customer` model:
   ```prisma
   sourcePage  String  @default("contact") @db.VarChar(50)
   ```
   Valid values: `"contact"`, `"landing"`, `"garden-room"`, `"configurator"`.
3. Add configurator-specific fields to the `Customer` model (nullable, only populated for configurator submissions):
   ```prisma
   configuratorProductSlug    String?  @db.VarChar(50)
   configuratorExteriorFinish String?  @db.VarChar(50)
   configuratorInteriorFinish String?  @db.VarChar(50)
   configuratorAddons         String?  // Comma-separated addon slugs
   configuratorTotalCents     Int?     // Total configured price in cents
   preferredDate              String?  @db.VarChar(50)  // "asap" or ISO date string
   ```
4. Run `npx prisma migrate dev --name add-configurator-fields` to generate the migration.

**Acceptance criteria:** Running `npx prisma migrate dev` succeeds. The `Customer` table now includes `sourcePage` and all configurator-specific columns. Existing rows have `sourcePage = "contact"` by default.

---

### Task C2: Update the submission endpoint to accept configurator data

**Scope:** The `POST /submissions/enquiry` endpoint needs to accept additional fields for configurator submissions and pass them through to the Customer record.

**Files to modify:**
- `apps/api/src/types/submission.ts` (Zod schema)
- `apps/api/src/routes/submissions.ts` (route handler)
- `apps/api/src/services/submissions.ts` (business logic)

**What to do:**
1. In `submission.ts`, extend `enquirySubmissionSchema` with optional fields:
   ```ts
   sourcePage: z.enum(['contact', 'landing', 'garden-room', 'configurator']).optional(),
   configuratorProductSlug: z.string().max(50).optional(),
   configuratorExteriorFinish: z.string().max(50).optional(),
   configuratorInteriorFinish: z.string().max(50).optional(),
   configuratorAddons: z.string().max(500).optional(),
   configuratorTotalCents: z.number().int().positive().optional(),
   preferredDate: z.string().max(50).optional(),
   ```
2. In `submissions.ts` (service), update the `Customer.create()` call within the transaction to include the new fields if present in the payload.
3. In `routes/submissions.ts`, ensure the new fields are forwarded from the validated body to the service.

**Acceptance criteria:** Sending a POST to `/submissions/enquiry` with configurator-specific fields creates a `Customer` record that includes the product slug, finish names, addons, and total price. Existing form submissions (without these fields) continue to work unchanged.

---

### Task C3: Update the frontend apiClient to send configurator data

**Scope:** Extend the `apiClient.submitEnquiry()` method to accept and transmit the additional configurator-specific fields.

**Files to modify:**
- `apps/web/src/lib/apiClient.ts`

**What to do:**
1. Extend the `submitEnquiry` method's parameter type to include optional fields:
   ```ts
   sourcePage?: string;
   configuratorProductSlug?: string;
   configuratorExteriorFinish?: string;
   configuratorInteriorFinish?: string;
   configuratorAddons?: string;
   configuratorTotalCents?: number;
   preferredDate?: string;
   ```
2. Pass these fields through in the POST body.
3. Extend the `SubmissionResponse` interface to include `quoteNumber: string` in the response.

**Acceptance criteria:** `apiClient.submitEnquiry()` can be called with or without configurator fields. When configurator fields are provided, they are included in the request body. The response now includes a `quoteNumber` field.

---

### Task C4: Return quote number in submission response

**Scope:** The API endpoint currently returns `{ ok: true, id: string }`. The configurator needs the generated quote number to display on the confirmation screen.

**Files to modify:**
- `apps/api/src/routes/submissions.ts`
- `apps/api/src/services/submissions.ts`

**What to do:**
1. In the service, ensure `generateQuoteNumber()` returns the quote number and it is available after the transaction.
2. In the route handler, include `quoteNumber` in the JSON response:
   ```ts
   res.status(200).json({ ok: true, id: submission.id, quoteNumber: customer.quoteNumber });
   ```

**Acceptance criteria:** The `POST /submissions/enquiry` response body includes a `quoteNumber` field (e.g., `"Q2610005"`).

---

### Task C5: Create configurator-specific email templates

**Scope:** Create HTML email templates for both internal (admin notification) and external (customer confirmation) emails, specifically tailored for configurator submissions.

**Files to create:**
- `apps/api/src/templates/configurator-internal.ts`
- `apps/api/src/templates/configurator-external.ts`

**What to do:**
1. **Internal template** (`configurator-internal.ts`):
   - Export a function `buildConfiguratorInternalEmail(data)` that returns `{ subject, html, text }`.
   - Subject: `"[Modular House] New Configurator Quote {quoteNumber} from {firstName}"`
   - HTML body includes:
     - Quote number and date
     - Customer details: name, email, phone, eircode
     - Product selection: name, dimensions, area
     - Exterior finish, interior finish
     - Selected add-ons with prices
     - Total configured price (formatted in EUR)
     - Preferred date
     - Customer message (if provided)
   - Plain text fallback with the same data.

2. **External template** (`configurator-external.ts`):
   - Export a function `buildConfiguratorExternalEmail(data)` that returns `{ subject, html, text }`.
   - Subject: `"Your Modular House Estimate -- {quoteNumber}"`
   - Apple-like clean design:
     - Modular House logo / brand header
     - "Thank you for your estimate, {firstName}"
     - Quote number in a prominent badge
     - Product summary card: product name, dimensions, finishes, add-ons, total price
     - Message: "Our team will contact you within 24 hours to discuss your project."
     - Footer with company contact details
   - HTML should use inline CSS for email client compatibility (no external stylesheets).
   - Plain text fallback.

**Acceptance criteria:** Both functions accept a data object and return well-formatted `{ subject, html, text }` objects. HTML renders correctly in major email clients (Gmail, Outlook, Apple Mail).

---

### Task C6: Integrate configurator email templates into the mailer service

**Scope:** Update the submission processing flow to detect configurator submissions and use the new email templates instead of the generic ones.

**Files to modify:**
- `apps/api/src/services/submissions.ts`
- `apps/api/src/services/mailer.ts` (if additional methods are needed)

**What to do:**
1. In the submission service's `processSubmission()` method:
   - Check if `sourcePage === 'configurator'`.
   - If yes, use `buildConfiguratorInternalEmail()` and `buildConfiguratorExternalEmail()` to generate the email content.
   - If no, use the existing generic email templates (no change to current behaviour).
2. Pass the customer's email, product details, finish names, add-on names and prices, total price, and quote number to the template builder functions.
3. Send both emails using the existing mailer service's `sendMail()` method.

**Acceptance criteria:** Configurator form submissions trigger two emails: an internal notification with full customer and configuration details, and a customer-facing Apple-style confirmation email. Non-configurator submissions continue to use the existing email templates.

---

## Task Dependency Graph

```
Workstream A (can be done in parallel with B and C):
  A1 (SEO) -----> independent
  A2 (bottom nav) -> independent
  A3 (step highlights) -> independent

Workstream B (sequential within, parallel with A and C):
  B1 (Eircode) --------\
  B2 (Date dropdown) ---+---> B6 (Wire form state) ---> B5 (Confirmation screen)
  B3 (Summary message) -+
  B4 (Honeypot) --------/

Workstream C (sequential within, parallel with A and B):
  C1 (DB schema) -> C2 (Endpoint) -> C4 (Response) -> C6 (Integration)
                                   \
  C3 (API client) -+                -> C5 (Email templates) -> C6 (Integration)
                   |
                   +---> B6 (Wire form state)
```

**Recommended execution order:**
1. A1, A2, A3, B1, B2, B3, B4 (all independent, can be parallelised)
2. C1 -> C2 -> C3 -> C4 (backend pipeline, sequential)
3. C5 (email templates, can be done in parallel with C1-C4)
4. B6 (depends on C3 for API client changes)
5. B5 (depends on B6 for form status)
6. C6 (depends on C5 and C4)

---

## Files Summary

| Task | Files Modified | Files Created |
|------|---------------|---------------|
| A1 | `GardenRoomConfigurator.tsx` | -- |
| A2 | `ProductConfiguratorPage.tsx`, `ProductConfigurator.css` | -- |
| A3 | `useConfiguratorState.ts`, `ProgressBar.tsx`, `types.ts` | -- |
| B1 | `ProductConfiguratorPage.tsx` | -- |
| B2 | `ProductConfiguratorPage.tsx`, `ProductConfigurator.css` | -- |
| B3 | `ProductConfiguratorPage.tsx` | -- |
| B4 | `ProductConfiguratorPage.tsx`, `ProductConfigurator.css` | -- |
| B5 | `ProductConfiguratorPage.tsx`, `ProductConfigurator.css`, `useConfiguratorState.ts` | -- |
| B6 | `ProductConfiguratorPage.tsx`, `useConfiguratorState.ts`, `types.ts` | -- |
| C1 | `prisma/schema.prisma` | migration file (auto-generated) |
| C2 | `types/submission.ts`, `routes/submissions.ts`, `services/submissions.ts` | -- |
| C3 | `apiClient.ts` | -- |
| C4 | `routes/submissions.ts`, `services/submissions.ts` | -- |
| C5 | -- | `templates/configurator-internal.ts`, `templates/configurator-external.ts` |
| C6 | `services/submissions.ts`, `services/mailer.ts` | -- |
