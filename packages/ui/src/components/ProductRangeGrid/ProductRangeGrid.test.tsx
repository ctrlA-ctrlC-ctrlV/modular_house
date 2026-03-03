/**
 * ProductRangeGrid Unit Tests
 * =============================================================================
 *
 * PURPOSE:
 * Validates the rendering behaviour, accessibility attributes, and visual
 * variant logic of the ProductRangeGrid component. Each test case maps to a
 * specific acceptance criterion from the component contract.
 *
 * TEST STRATEGY:
 * - Mock data mirrors the 4 product instances defined in the data model
 *   (15m2 Compact Studio, 25m2 Garden Suite, 35m2 Garden Living, 45m2 Grand Studio).
 * - Tests assert on rendered DOM structure rather than implementation details,
 *   following React Testing Library's guiding principle of testing user-visible
 *   behaviour.
 * - No "any" types are used; all mock data conforms to the ProductCard interface.
 *
 * ENVIRONMENT:
 * Runs in a browser context via Vitest + Playwright with @testing-library/react.
 *
 * =============================================================================
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProductRangeGrid, type ProductCard } from './ProductRangeGrid';

/* =============================================================================
   SECTION 1: MOCK DATA
   -----------------------------------------------------------------------------
   Four product instances matching the data model specification. These serve
   as the canonical test fixtures and cover all visual variants:
   - Available product without badge (15m2)
   - Available product with "Most Popular" badge (25m2)
   - Unavailable product with "Coming Soon" badge (35m2, 45m2)
   ============================================================================= */

const MOCK_PRODUCTS: ProductCard[] = [
  {
    size: '15m\u00B2',
    name: 'Compact Studio',
    image: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    useCases: ['Home office', 'Art studio', 'Yoga room'],
    planningNote: 'No planning permission required',
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=garden-room-15',
    available: true,
  },
  {
    size: '25m\u00B2',
    name: 'Garden Suite',
    image: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    useCases: ['Home office + meeting space', 'Home gym', 'Music studio', '1 bed room en suite'],
    planningNote: 'No planning permission required',
    badge: 'Most Popular',
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=garden-room-25',
    available: true,
  },
  {
    size: '35m\u00B2',
    name: 'Garden Living',
    image: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    useCases: ['Guest suite', 'Teen retreat', 'Rental unit'],
    planningNote: 'Legislation pending',
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/contact?product=garden-room-35&interest=true',
    available: false,
  },
  {
    size: '45m\u00B2',
    name: 'Grand Studio',
    image: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    useCases: ['Self-contained apartment', 'Multi-room workspace'],
    planningNote: 'Legislation pending',
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/contact?product=garden-room-45&interest=true',
    available: false,
  },
];

/** Header text used across multiple test cases. */
const HEADER_PROPS = {
  eyebrow: 'OUR RANGE',
  title: 'Choose Your Perfect Size',
  description: 'Every garden room is precision-built with CNC-cut steel framing.',
};

/* =============================================================================
   SECTION 2: TEST LIFECYCLE
   ============================================================================= */

/**
 * Clean up the DOM after each test to prevent state leakage between
 * test cases. Required because @testing-library/react render mounts
 * into the same document across tests.
 */
afterEach(() => {
  cleanup();
});

/* =============================================================================
   SECTION 3: TEST SUITE
   ============================================================================= */

describe('ProductRangeGrid', () => {
  /* -------------------------------------------------------------------------
     TEST CASE 1: Card count verification
     Ensures the component renders exactly one <article> per product entry.
     This confirms the map iteration works and no items are skipped or
     duplicated.
     ------------------------------------------------------------------------- */
  it('renders all 4 product cards when given 4 products', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(4);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 2: Header content rendering
     Validates that the eyebrow, title, and description text are all present
     in the rendered output.
     ------------------------------------------------------------------------- */
  it('displays the eyebrow, title, and description text', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    expect(screen.getByText('OUR RANGE')).toBeDefined();
    expect(screen.getByText('Choose Your Perfect Size')).toBeDefined();
    expect(screen.getByText('Every garden room is precision-built with CNC-cut steel framing.')).toBeDefined();
  });

  /* -------------------------------------------------------------------------
     TEST CASE 3: "Most Popular" badge rendering
     The 25m2 Garden Suite card should display a "Most Popular" badge with
     the --popular BEM modifier class for brand-colour styling.
     ------------------------------------------------------------------------- */
  it('shows "Most Popular" badge on the 25m2 card', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const badge = screen.getByText('Most Popular');
    expect(badge).toBeDefined();
    expect(badge.classList.contains('product-range-card__badge--popular')).toBe(true);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 4: "Coming Soon" badge rendering
     Both the 35m2 and 45m2 cards should display "Coming Soon" badges with
     the --coming-soon BEM modifier class.
     ------------------------------------------------------------------------- */
  it('shows "Coming Soon" badge on 35m2 and 45m2 cards', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const badges = screen.getAllByText('Coming Soon');
    expect(badges).toHaveLength(2);

    badges.forEach((badge) => {
      expect(badge.classList.contains('product-range-card__badge--coming-soon')).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------
     TEST CASE 5: Coming-soon CSS modifier class
     Verifies that <article> elements for unavailable products receive the
     --coming-soon modifier class, which controls the dashed border and
     reduced image opacity via CSS.
     ------------------------------------------------------------------------- */
  it('applies product-range-card--coming-soon CSS class when available is false', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const articles = screen.getAllByRole('article');

    /**
     * The first two cards (15m2, 25m2) are available — they should NOT
     * have the --coming-soon modifier. The last two (35m2, 45m2) are
     * unavailable — they SHOULD have it.
     */
    expect(articles[0].classList.contains('product-range-card--coming-soon')).toBe(false);
    expect(articles[1].classList.contains('product-range-card--coming-soon')).toBe(false);
    expect(articles[2].classList.contains('product-range-card--coming-soon')).toBe(true);
    expect(articles[3].classList.contains('product-range-card--coming-soon')).toBe(true);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 6: CTA text for available vs unavailable products
     Available products show "Get a Quote"; unavailable products show
     "Register Interest". This validates the data-driven CTA text rendering.
     ------------------------------------------------------------------------- */
  it('renders "Get a Quote" CTA for available products and "Register Interest" for unavailable', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const getQuoteLinks = screen.getAllByText('Get a Quote');
    const registerLinks = screen.getAllByText('Register Interest');

    expect(getQuoteLinks).toHaveLength(2);
    expect(registerLinks).toHaveLength(2);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 7: CTA link href values
     Each CTA link must navigate to the contact page with the correct
     product query parameter. This test validates the href attribute on
     the rendered <a> elements.
     ------------------------------------------------------------------------- */
  it('CTA links contain correct href values', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const allLinks = screen.getAllByRole('link');

    /**
     * Extract href values from all rendered links and verify each
     * expected product URL is present in the set.
     */
    const hrefs = allLinks.map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/contact?product=garden-room-15');
    expect(hrefs).toContain('/contact?product=garden-room-25');
    expect(hrefs).toContain('/contact?product=garden-room-35&interest=true');
    expect(hrefs).toContain('/contact?product=garden-room-45&interest=true');
  });

  /* -------------------------------------------------------------------------
     TEST CASE 8: Use-cases list item count
     Each card should render the correct number of <li> elements matching
     the length of its useCases array. This validates the list mapping logic.
     ------------------------------------------------------------------------- */
  it('each card renders the use-cases list with the correct number of li items', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    /**
     * Verify specific use-case items are present in the DOM.
     * The total number of <li> elements should equal the sum of all
     * useCases arrays: 3 + 4 + 3 + 2 = 12.
     */
    const allListItems = screen.getAllByRole('listitem');
    expect(allListItems).toHaveLength(12);

    /** Spot-check individual use case text nodes. */
    expect(screen.getByText('Home office')).toBeDefined();
    expect(screen.getByText('Home gym')).toBeDefined();
    expect(screen.getByText('Guest suite')).toBeDefined();
    expect(screen.getByText('Self-contained apartment')).toBeDefined();
  });

  /* -------------------------------------------------------------------------
     TEST CASE 9: Variable product count (3, 4, and 5 products)
     The component must handle arrays of different lengths gracefully.
     This validates the grid renders the correct number of cards for
     3 products (subset), 4 products (default), and 5 products (future
     expansion with a potential 5th size).
     ------------------------------------------------------------------------- */
  it('renders correctly with 3, 4, or 5 products', () => {
    /** Test with 3 products (subset of the default 4). */
    const threeProducts = MOCK_PRODUCTS.slice(0, 3);
    const { unmount: unmount3 } = render(
      <ProductRangeGrid products={threeProducts} {...HEADER_PROPS} />
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
    unmount3();

    /** Test with 4 products (standard set). */
    const { unmount: unmount4 } = render(
      <ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />
    );
    expect(screen.getAllByRole('article')).toHaveLength(4);
    unmount4();

    /** Test with 5 products (future 5th size edge case). */
    const fifthProduct: ProductCard = {
      size: '55m\u00B2',
      name: 'Grand Estate',
      image: '/resource/garden-room/garden-room5.png',
      useCases: ['Full guest house', 'Home studio complex'],
      planningNote: 'Full planning required',
      ctaText: 'Register Interest',
      ctaLink: '/contact?product=garden-room-55&interest=true',
      available: false,
    };
    const fiveProducts = [...MOCK_PRODUCTS, fifthProduct];
    render(<ProductRangeGrid products={fiveProducts} {...HEADER_PROPS} />);
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  /* -------------------------------------------------------------------------
     TEST CASE 10: Product name in h3 heading
     Each card <article> must contain an <h3> element with the product name.
     This validates the semantic heading hierarchy (section h2 -> card h3)
     and correct name rendering.
     ------------------------------------------------------------------------- */
  it('each card article contains an h3 with the product name', () => {
    render(<ProductRangeGrid products={MOCK_PRODUCTS} {...HEADER_PROPS} />);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(4);

    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain('Compact Studio');
    expect(headingTexts).toContain('Garden Suite');
    expect(headingTexts).toContain('Garden Living');
    expect(headingTexts).toContain('Grand Studio');
  });
});
