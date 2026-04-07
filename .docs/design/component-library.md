# Component Library

All reusable components live in `packages/ui/src/components/` and are exported from `packages/ui/src/index.ts`.

---

## Navigation

### Header
**File**: `packages/ui/src/components/Header/Header.tsx`  
**Props**: `variant`, `menuItems`, `socialLinks`, `positionOver`

- Sticky navigation bar with logo, menu items, and CTA button
- Desktop: Horizontal menu with dropdown submenus (fadeIn 0.2s)
- Mobile (< 768px): Hamburger icon opens slide-in drawer
- Container max-width: 1650px
- CTA button always visible regardless of viewport

### Footer
**File**: `packages/ui/src/components/Footer/Footer.tsx`  
**Props**: `companyName`, `links[]`, `socialLinks[]`

- Dark background (`--brand-bg-dark`)
- Company info, navigation links, social media icons
- Copyright notice

### TrueFooter
**File**: `packages/ui/src/components/TrueFooter/TrueFooter.tsx`

- Bottom-most footer strip (legal links, minimal info)

---

## Heroes

### HeroWithSideText
**File**: `packages/ui/src/components/HeroWithSideText/HeroWithSideText.tsx`  
**Props**: `backgroundImage`, `title`, `buttonLinks`

- Full-viewport height (100vh, 45–50vh on mobile)
- Background image via `<picture>` (AVIF/WebP/fallback)
- Semi-transparent overlay: `rgba(0,0,0,0.4)`
- Text aligned to bottom-left with side element
- CTA buttons in brand-link color

### HeroBoldBottomText
**File**: `packages/ui/src/components/HeroBoldBottomText/HeroBoldBottomText.tsx`  
**Props**: `backgroundImage`, `title`

- Full-viewport hero with bold text anchored to bottom
- Same image optimization pattern as HeroWithSideText

---

## Product Display

### ProductShowcase
**File**: `packages/ui/src/components/ProductShowcase/ProductShowcase.tsx`  
**Props**: `products[]`, `features[]`, `warranties[]`

- 50/50 split layout: product rows (left) with feature bullets (right)
- Product rows: 110px height, hover = `scale(1.015)` + shadow lift (0.35s cubic-bezier)
- Background image with left/right fade overlays
- Warranty badges below

### ProductRangeGrid
**File**: `packages/ui/src/components/ProductRangeGrid/ProductRangeGrid.tsx`  
**Props**: `products[]`, `eyebrow`, `title`  
**Exports**: `ProductCard` type

- Responsive grid: 4 → 2 → 1 columns (desktop → tablet → mobile)
- Cards with image, title, price, quick-view trigger
- Dashed border for unavailable products, solid for available

### QuickViewModal
**File**: `packages/ui/src/components/QuickViewModal/QuickViewModal.tsx`  
**Props**: `product`, `onClose`  
**Exports**: `QuickViewProduct` type

- Lightbox-style modal for product detail
- Image gallery + specifications
- Border-radius: 4–8px
- Close on overlay click or Escape key

---

## Content Sections

### FeatureSection
**File**: `packages/ui/src/components/FeatureSection/FeatureSection.tsx`  
**Props**: `features[]`, `topHeading`, `mainHeading`

- Desktop (≥ 650px): 4-column grid of feature cards with icons
- Mobile (< 650px): Horizontal carousel with swipe
- Icons via CustomIcons component (24–32px)

### TwoColumnSplitLayout
**File**: `packages/ui/src/components/TwoColumnSplitLayout/TwoColumnSplitLayout.tsx`  
**Props**: `leftContent`, `rightImage`, `backgroundColor`

- 50/50 content/image split
- Reversible (image left or right)
- Stacks vertically on mobile

### ComparisonSection
**File**: `packages/ui/src/components/ComparisonSection/ComparisonSection.tsx`  
**Props**: `categories[]`, `materials[]`, `viewMode`  
**Exports**: `ComparisonCategory`, `MaterialScore`, `MaterialMeta` types

- Material comparison table/grid
- Toggle between table and card view modes
- Responsive: scrollable table on mobile

### InfoBanner
**File**: `packages/ui/src/components/InfoBanner/InfoBanner.tsx`  
**Props**: `body`, `statusItems[]`, `link`  
**Exports**: `StatusType` type

- Status banner with configurable status icons
- Supports success/warning/error/info semantic colors

### GoBespokeBanner
**File**: `packages/ui/src/components/GoBespokeBanner/GoBespokeBanner.tsx`  
**Props**: customizable CTA content

- Custom product call-to-action banner
- Brand gradient background option

---

## Social Proof

### TestimonialGrid
**File**: `packages/ui/src/components/TestimonialGrid/TestimonialGrid.tsx`  
**Props**: `testimonials[]`, `eyebrow`, `title`

- 3 → 2 → 1 column responsive grid
- Quote cards with customer name and project type
- Eyebrow heading pattern (uppercase, wide tracking)

---

## FAQ

### AccordionFAQ
**File**: `packages/ui/src/components/AccordionFAQ/AccordionFAQ.tsx`  
**Props**: `items[]`, `title`, `subtitle`  
**Exports**: `AccordionFAQItem` type

- Expandable question/answer pairs
- Chevron rotates 180° on toggle
- Single-item open at a time

### MiniFAQs
**File**: `packages/ui/src/components/MiniFAQs/MiniFAQs.tsx`

- Compact FAQ section for inline use
- Simplified styling compared to AccordionFAQ

---

## Gallery

### MasonryGallery
**File**: `packages/ui/src/components/MasonryGallery/MasonryGallery.tsx`  
**Props**: `images[]`, `columns`

- CSS masonry grid (4 → 2 → 1 columns)
- Image hover: `scale(1.05)` (0.3s)
- Gap: 0–6px between items

### FullMassonryGallery
**File**: `packages/ui/src/components/FullMassonryGallery/FullMassonryGallery.tsx`  
**Props**: `images[]`, lightbox enabled

- Masonry layout with integrated lightbox
- Previous/Next navigation arrows
- Close on Escape or overlay click

### InfiniteMasonryGallery
**File**: `packages/ui/src/components/InfiniteMasonryGallery/InfiniteMasonryGallery.tsx`  
**Props**: `images[]`, `onLoadMore`, `header`  
**Exports**: `InfiniteGalleryImage` type

- Infinite scroll loading pattern
- Loading indicator at bottom
- Header slot for filtering controls

---

## Forms & Contact

### ContactFormWithImageBg
**File**: `packages/ui/src/components/ContactFormWithImageBg/ContactFormWithImageBg.tsx`  
**Props**: `backgroundImage`, `fields[]`, `onSubmit`

- Contact form overlaid on background image
- Full-width inputs, brand-link focus border

### TextWithContactForm
**File**: `packages/ui/src/components/TextWithContactForm/TextWithContactForm.tsx`

- Two-column: contact info (left) + form (right)
- Built-in LocationIcon, PhoneIcon, EmailIcon (custom SVGs)
- Stacks vertically on mobile

### EnquiryFormModal
**File**: `packages/ui/src/components/EnquiryFormModal/EnquiryFormModal.tsx`  
**Props**: `isOpen`, `onClose`, `onSubmit`  
**Exports**: `EnquiryFormData` type

- Modal dialog with enquiry form
- Keyboard-accessible (Escape to close)
- Border-radius: 4–8px

### NewsletterSection
**File**: `packages/ui/src/components/NewsletterSection/NewsletterSection.tsx`

- Email subscription input + submit button
- Inline validation feedback

---

## Utility Components

### OptimizedImage
**File**: `packages/ui/src/components/OptimizedImage/OptimizedImage.tsx`  
**Props**: `src`, `srcWebP`, `srcAvif`, `alt`

- `<picture>` element with AVIF → WebP → original fallback chain
- Lazy loading support
- Required `alt` text for accessibility

### Seo
**File**: `packages/ui/src/components/Seo/Seo.tsx`  
**Props**: `title`, `description`, `jsonld`

- Sets `<head>` meta tags via react-helmet-async
- Supports JSON-LD structured data
- Open Graph and Twitter Card meta

### CustomIcons
**File**: `packages/ui/src/components/CustomIcons/CustomIcons.tsx`  
**Props**: `name`, `size` (default 24), `className`, `style`

- SVG icon component with embedded path definitions
- Available icons: spacer, bioEnergy, and more
- Supports Tailwind classes for coloring

### InfoButton
**File**: `packages/ui/src/components/InfoButton/InfoButton.tsx`

- Button that triggers an information popover
- Used for contextual help
