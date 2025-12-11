# Feature Specification: Template–Skeleton Integration

**Feature Branch**: `001-template-skeleton-integration`  
**Created**: 2025-12-01  
**Status**: Draft  
**Input**: User description: "Integrate the template stored in .template with the skeleton made in 001-web-app-skeleton"

## Summary

Integrate the template (`.template/rebar` and `.template/rebar-child`) with the existing skeleton structure for the garden room/house extension company's website. The integration will ensure a consistent and unified design across all public pages and adhere to accessibility standards.

## Scope

The public-facing pages to be styled using the template include:

- **Landing/Home (`/`)**
- **About (`/about`)**
- **Gallery (`/gallery`)**
- **Contact (`/contact`)**
- **Not Found (`/404`)**
- **Garden Room (`/garden-room`)**
- **House Extension (`/house-extension`)**
- **Terms and Conditions (`/terms`)**
- **Privacy Policy (`/privacy`)**

### Out of Scope

- Admin UI pages (unless explicitly stated)
- Functional changes to existing routes (focus is on styling integration)

## Goals

1. **Unified Aesthetic**: Apply layout, typography, and utility styles defined by the template to all public-facing pages.
2. **Maintain Accessibility**: Ensure that existing accessibility functionalities are not compromised during the integration.
3. **Preserve Behavior**: No regressions in the current functionality of routes and components.
4. **Reusability and Developer Guidelines**: Document the integrated class naming and style rules for future scalability.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Template-driven Pages Available *(Priority: P1)*

Visitors and editors see consistent, branded pages rendered using the unified template integrated into the existing skeleton. The template governs layout (header, footer, container), typography, and reusable components without changing underlying app functionality.

#### Acceptance Scenarios:

1. **Given** the skeleton routes exist, **When** the template layout is applied globally, **Then** all public pages render with the template header, footer, and base styles.
2. **Given** accessible focus styles exist, **When** tabbing through navigation and form controls, **Then** users see visible focus indicators consistent with the template.

#### Independent Test:
Switch the app to use the template’s layout wrapper and styles; verify that all specified routes render properly and maintain functionality.

---

### User Story 2 - Components Aligned to Template *(Priority: P2)*

Shared and page-level components follow the template’s naming convention and structure.

#### Acceptance Scenarios:

1. **Given** shared components (e.g., Header, Button-like link), **When** they are updated with class names and modifiers from the template, **Then** styling is consistent across pages.
2. **Given** utility classes provided by the template, **When** developers apply `c-`, `l-`, `u-` prefixed classes, **Then** components render predictably.

#### Independent Test:
Update at least two components to use the template classes and verify visual and functional consistency.

---

### User Story 3 - Accessibility Preserved *(Priority: P3)*

Integration preserves existing accessibility features: focus management, skip links, labels, alt text, and keyboard navigation.

#### Acceptance Scenarios:

1. **Given** accessible forms, **When** submitting invalid data, **Then** error states are announced with consistent styles and assistive text (`aria-describedby` linked properly).
2. **Given** a lightbox or modal, **When** opened and closed, **Then** focus is trapped within and restored on close.

---

### Edge Cases

- Template styles conflict with existing `index.css`: resolve precedence without breaking layouts.
- Route-specific unique styles: ensure coexistence without leaking globally.
- High-contrast and reduced-motion preferences: template respects user settings.

## Requirements *(mandatory)*

### Functional Requirements

1. **FR-026**: Apply the template’s global layout (header, footer, container) to all public routes without altering their behavior.
2. **FR-027**: Align shared components and individual pages to the template’s BEM-inspired naming (`c-`, `l-`, `u-` prefixes).
3. **FR-028**: Document utility classes, layout rules, and component naming conventions.
4. **FR-029**: Preserve existing accessibility features during the integration process.
5. **FR-030**: Ensure that the template integration is reversible, allowing fallback to existing styles (`index.css`) without breaking layouts.

### Pending Questions

- **FR-031**: Will restricted application of template (e.g., not admin pages) suffice for this phase?
- **FR-032**: Should `.template` or `index.css` serve as the source of truth for branding tokens?

## Success Criteria *(mandatory)*

### Measurable Outcomes

1. **SC-051**: Public pages use the template layout and pass visual consistency checks for at least 6 specified routes.
2. **SC-052**: All interactive elements (buttons, links, inputs) provide visible focus indicators during keyboard navigation.
3. **SC-053**: No routes break due to the integration—forms, navigation, and links behave as before.
4. **SC-054**: Developers demonstrate class naming consistency by updating at least 3 page components with template styles.

## Risks

1. **CSS Conflict**: Existing `index.css` might conflict with the template styles.
   - *Mitigation*: Use scoped classes and thoroughly review stylesheets before integration.
2. **Accessibility Regression**: Minor visual updates could break ARIA roles or labels.
   - *Mitigation*: Perform manual accessibility testing for all routes.
3. **Timeline Creep**: Complexity in adapting the template might extend the integration.
   - *Mitigation*: Prioritize critical routes and features first (P1 stories).