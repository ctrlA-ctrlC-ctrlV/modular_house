/**
 * ProductRangeGrid Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the ProductRangeGrid component,
 * enabling isolated development, visual testing, and documentation.
 *
 * STORY STRUCTURE:
 * - Default: Component with typical product mix (available + coming soon)
 * - AllAvailable: All products are orderable
 * - AllComingSoon: All products are unavailable/coming soon
 * - WithCustomHeader: Custom eyebrow, title, and description
 * - SingleProduct: Edge case with only one product card
 * - ManyProducts: Stress test with many products
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProductRangeGrid, ProductCard } from './ProductRangeGrid';

/* =============================================================================
   SAMPLE DATA
   -----------------------------------------------------------------------------
   Reusable product card data for story demonstrations.
   ============================================================================= */

const sampleProducts: ProductCard[] = [
  {
    size: '15m²',
    name: 'Compact Studio',
    tagline: 'Your private creative sanctuary',
    image: 'https://via.placeholder.com/600x400/E5E7DE/333?text=15m²+Studio',
    useCases: ['Home office', 'Art studio', 'Yoga room'],
    price: '€26,000',
    planningPermission: false,
    inStock: true,
    badge: 'Most Popular',
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=compact-studio',
    available: true,
  },
  {
    size: '20m²',
    name: 'Garden Office',
    tagline: 'Where work meets living',
    image: 'https://via.placeholder.com/600x400/E5E7DE/333?text=20m²+Office',
    useCases: ['Remote work hub', 'Meeting space', 'Guest room'],
    price: '€32,000',
    planningPermission: false,
    inStock: true,
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=garden-office',
    available: true,
  },
  {
    size: '25m²',
    name: 'Premium Suite',
    tagline: 'Space to grow into',
    image: 'https://via.placeholder.com/600x400/E5E7DE/333?text=25m²+Suite',
    useCases: ['Multi-purpose room', 'Home gym', 'Guest suite'],
    price: '€37,000',
    planningPermission: false,
    inStock: true,
    ctaText: 'Get a Quote',
    ctaLink: '/contact?product=premium-suite',
    available: true,
  },
  {
    size: '30m²',
    name: 'Grand Extension',
    tagline: 'A building, not just a room',
    image: 'https://via.placeholder.com/600x400/888/fff?text=30m²+Coming+Soon',
    useCases: ['Open-plan living', 'Kitchen extension', 'Family room'],
    price: '€54,000',
    planningPermission: true,
    inStock: false,
    badge: 'Coming Soon',
    ctaText: 'Register Interest',
    ctaLink: '/contact?product=grand-extension&interest=true',
    available: false,
  },
];

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Storybook meta configuration defining component defaults and documentation.
   ============================================================================= */

const meta: Meta<typeof ProductRangeGrid> = {
  title: 'Components/ProductRangeGrid',
  component: ProductRangeGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A responsive grid of product cards displaying garden room sizes with pricing CTAs. Supports "available" and "coming soon" visual variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description: 'Small uppercase label displayed above the title',
    },
    title: {
      control: 'text',
      description: 'Main section heading (h2)',
    },
    description: {
      control: 'text',
      description: 'Paragraph text below the title',
    },
    products: {
      control: 'object',
      description: 'Array of ProductCard objects to render in the grid',
    },
    renderLink: {
      description: 'Custom link renderer for SPA navigation (e.g., React Router Link)',
      table: {
        type: { summary: 'LinkRenderer' },
      },
    },
    showOriginalPrice: {
      control: 'boolean',
      description:
        'When true, cards whose data carries an `originalPrice` render it as a strikethrough next to the current sale price.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProductRangeGrid>;

/* =============================================================================
   STORY DEFINITIONS
   ============================================================================= */

/**
 * Default Story
 * Renders a typical product grid with a mix of available and coming-soon items.
 */
export const Default: Story = {
  args: {
    eyebrow: 'Our Range',
    title: 'Garden Rooms Built To Last',
    description:
      'Choose from our range of precision-engineered steel frame garden rooms, designed for comfort and durability.',
    products: sampleProducts,
  },
};

/**
 * All Available Story
 * Demonstrates the grid when all products are orderable (filled CTA buttons).
 */
export const AllAvailable: Story = {
  args: {
    eyebrow: 'Available Now',
    title: 'Ready To Order',
    description: 'All products are available for immediate order with fast delivery.',
    products: sampleProducts.map((p) => ({
      ...p,
      available: true,
      inStock: true,
      planningPermission: false,
      badge: p.badge === 'Coming Soon' ? undefined : p.badge,
      ctaText: 'Get a Quote',
    })),
  },
};

/**
 * All Coming Soon Story
 * Demonstrates the grid when all products are unavailable (outline CTA buttons, dashed borders).
 */
export const AllComingSoon: Story = {
  args: {
    eyebrow: 'Coming Soon',
    title: 'Future Products',
    description: 'Register your interest in our upcoming product range.',
    products: sampleProducts.map((p) => ({
      ...p,
      available: false,
      inStock: false,
      planningPermission: true,
      badge: 'Coming Soon',
      ctaText: 'Register Interest',
    })),
  },
};

/**
 * With Custom Header Story
 * Shows customisation of the header section text.
 */
export const WithCustomHeader: Story = {
  args: {
    eyebrow: 'Steel Frame Excellence',
    title: 'Expand Your Living Space',
    description:
      'Our modular garden rooms combine precision engineering with contemporary design. Built off-site for faster installation and minimal disruption.',
    products: sampleProducts.slice(0, 3),
  },
};

/**
 * Single Product Story
 * Edge case with only one product card to verify layout behavior.
 */
export const SingleProduct: Story = {
  args: {
    eyebrow: 'Featured',
    title: 'Our Best Seller',
    description: 'The most popular choice for home office setups.',
    products: [sampleProducts[0]],
  },
};

/**
 * Many Products Story
 * Stress test with more products than the typical 4-column layout.
 */
export const ManyProducts: Story = {
  args: {
    eyebrow: 'Full Range',
    title: 'Every Size You Need',
    description: 'From compact studios to grand extensions, we have a solution for every space.',
    products: [
      ...sampleProducts,
      {
        size: '12m²',
        name: 'Micro Pod',
        tagline: 'Compact creativity',
        image: 'https://via.placeholder.com/600x400/E5E7DE/333?text=12m²+Pod',
        useCases: ['Reading nook', 'Phone booth', 'Meditation space'],
        price: '€18,000',
        planningPermission: false,
        inStock: true,
        ctaText: 'Get a Quote',
        ctaLink: '/contact?product=micro-pod',
        available: true,
      },
      {
        size: '35m²',
        name: 'Executive Suite',
        tagline: 'Professional space redefined',
        image: 'https://via.placeholder.com/600x400/888/fff?text=35m²+Executive',
        useCases: ['Conference room', 'Recording studio', 'Private office'],
        price: '€65,000',
        planningPermission: true,
        inStock: false,
        badge: 'Coming Soon',
        ctaText: 'Register Interest',
        ctaLink: '/contact?product=executive-suite&interest=true',
        available: false,
      },
    ],
  },
};

/**
 * No Header Story
 * Demonstrates the grid without any header content.
 */
export const NoHeader: Story = {
  args: {
    products: sampleProducts.slice(0, 2),
  },
};

/**
 * With Image Variants Story
 * Demonstrates products with WebP and AVIF image variants.
 */
export const WithImageVariants: Story = {
  args: {
    eyebrow: 'Optimised Images',
    title: 'Modern Format Support',
    description: 'Products with WebP and AVIF image variants for optimal loading.',
    products: [
      {
        size: '15m²',
        name: 'Compact Studio',
        tagline: 'Your private creative sanctuary',
        image: '/resource/garden-room/garden-room2.png',
        imageWebP: '/resource/garden-room/garden-room2.webp',
        imageAvif: '/resource/garden-room/garden-room2.avif',
        useCases: ['Home office', 'Art studio', 'Yoga room'],
        price: '€26,000',
        planningPermission: false,
        inStock: true,
        badge: 'Most Popular',
        ctaText: 'Get a Quote',
        ctaLink: '/contact?product=compact-studio',
        available: true,
      },
      {
        size: '20m²',
        name: 'Garden Office',
        tagline: 'Where work meets living',
        image: '/resource/garden-room/garden-room5.png',
        imageWebP: '/resource/garden-room/garden-room5.webp',
        imageAvif: '/resource/garden-room/garden-room5.avif',
        useCases: ['Remote work hub', 'Meeting space', 'Guest room'],
        price: '€32,000',
        planningPermission: false,
        inStock: true,
        ctaText: 'Get a Quote',
        ctaLink: '/contact?product=garden-office',
        available: true,
      },
    ],
  },
};

/* =============================================================================
   STRIKETHROUGH / SALE-MODE STORIES
   -----------------------------------------------------------------------------
   Exercise the opt-in pre-sale price strikethrough behaviour added alongside
   the 011-sales-discount feature. These stories confirm that:
     1. Cards with an `originalPrice` render the strikethrough layout when
        `showOriginalPrice` is true.
     2. Cards without an `originalPrice` transparently fall back to the
        standard "Turnkey price from" layout even in sale mode.
     3. The component renders identically to the default when the flag
        is toggled off, regardless of per-card data.
   ============================================================================= */

/**
 * Sample products carrying both sale and pre-sale prices. Mirrors the
 * production dataset shape for Garden Room products during an active
 * campaign: every card defines `originalPrice` in addition to `price`.
 */
const saleProducts: ProductCard[] = sampleProducts.map((p) => {
  switch (p.size) {
    case '15m²':
      return { ...p, originalPrice: '€40,000' };
    case '20m²':
      return { ...p, originalPrice: '€48,000' };
    case '25m²':
      return { ...p, originalPrice: '€58,000' };
    case '30m²':
      return { ...p, originalPrice: '€81,221' };
    default:
      return p;
  }
});

/**
 * With Strikethrough Story
 *
 * Displays the full grid in sale mode with original prices struck through
 * beside the current discounted figures. Demonstrates the default opt-in
 * path a marketing campaign would ship.
 */
export const WithStrikethrough: Story = {
  args: {
    eyebrow: 'Spring Sale',
    title: 'Limited Time Offer',
    description:
      'Every size in the range is discounted for the duration of the campaign. Original prices shown struck through.',
    products: saleProducts,
    showOriginalPrice: true,
  },
};

/**
 * Mixed Strikethrough Story
 *
 * Verifies the graceful fallback behaviour when some cards lack an
 * `originalPrice`: sale-mode is active at the grid level, but only the
 * cards with sufficient data render the strikethrough layout. The
 * remaining cards render the standard "Turnkey price from" label.
 */
export const MixedStrikethrough: Story = {
  args: {
    eyebrow: 'Partial Sale',
    title: 'Selected Sizes Reduced',
    description:
      'Only the first two cards in this grid carry an `originalPrice`; the rest fall back to the default label layout.',
    products: saleProducts.map((p, i) => (i < 2 ? p : { ...p, originalPrice: undefined })),
    showOriginalPrice: true,
  },
};

/**
 * Strikethrough Disabled Story
 *
 * Confirms that setting `showOriginalPrice={false}` suppresses the
 * strikethrough layout on every card, even when the underlying data
 * carries an `originalPrice`. Used to verify the opt-in semantics.
 */
export const StrikethroughDisabled: Story = {
  args: {
    eyebrow: 'Standard View',
    title: 'No Discount Applied',
    description:
      'Product data contains `originalPrice` fields but `showOriginalPrice` is false, so the standard layout is rendered.',
    products: saleProducts,
    showOriginalPrice: false,
  },
};
