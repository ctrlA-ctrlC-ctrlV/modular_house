/**
 * QuickViewModal Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the QuickViewModal component,
 * enabling isolated development, visual testing, and documentation.
 *
 * STORY STRUCTURE:
 * - Default: In-stock product with full details
 * - PreOrder: Pre-order product with planning permission required
 * - MinimalData: Product with only required fields
 * - CustomCtaText: Product with a custom CTA label
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { QuickViewModal, type QuickViewProduct } from './QuickViewModal';

/* =============================================================================
   SAMPLE DATA
   ============================================================================= */

const inStockProduct: QuickViewProduct = {
  size: '15m²',
  name: 'Compact Studio',
  tagline: 'Your private creative sanctuary',
  image: 'https://via.placeholder.com/620x320/E5E7DE/333?text=15m²+Studio',
  useCases: ['Home Office', 'Art Studio', 'Yoga & Wellness Room', 'Music Practice'],
  price: '€26,000',
  planningPermission: false,
  inStock: true,
  available: true,
  description:
    'Compact yet generous, The Studio is precision-engineered for focused work and creative pursuits. Floor-to-ceiling glazing floods the space with natural light, while our thermally broken steel frame ensures year-round comfort. Perfect for those who need a dedicated space without the footprint.',
  specs: {
    footprint: '5.0m × 3.0m',
    height: '2.7m internal',
    frame: 'Galvanised steel SHS',
    insulation: '120mm PIR (U-value 0.15)',
    glazing: 'Triple-glazed aluminium',
    heating: 'Air-to-air heat pump',
    electrics: 'Full consumer unit, Cat6 ready',
  },
  leadTime: '6–8 weeks',
  ctaLink: '/contact?product=garden-room-15',
};

const preOrderProduct: QuickViewProduct = {
  size: '35m²',
  name: 'Garden Living',
  tagline: 'Space to grow into',
  image: 'https://via.placeholder.com/620x320/888/fff?text=35m²+Living',
  useCases: ['Multi-Desk Workspace', 'Home Gym + Office', 'Family Room', 'Content Studio'],
  price: '€65,000',
  planningPermission: true,
  inStock: false,
  available: false,
  description:
    'The Pavilion is built for those who need room to move. Whether it\'s a two-person workspace with a breakout area, a home gym with an office nook, or a family media room — 35m² gives you genuine flexibility. Our portal steel frame means zero internal columns, so the space is entirely yours to define.',
  specs: {
    footprint: '7.0m × 5.0m',
    height: '2.7m internal',
    frame: 'Galvanised steel portal frame',
    insulation: '150mm PIR (U-value 0.12)',
    glazing: 'Triple-glazed aluminium',
    heating: 'Air-to-air heat pump',
    electrics: 'Full consumer unit, Cat6 ready',
    plumbing: 'Optional kitchenette & WC',
  },
  leadTime: '10–12 weeks',
  ctaLink: '/contact?product=garden-room-35&interest=true',
  ctaText: 'Register Interest',
};

/* =============================================================================
   META CONFIGURATION
   ============================================================================= */

const meta: Meta<typeof QuickViewModal> = {
  title: 'Components/QuickViewModal',
  component: QuickViewModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A full-screen overlay modal displaying an expanded product preview with hero image, description, technical specs, pricing, and a CTA link.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    product: {
      control: 'object',
      description: 'The product data to display in the modal. Pass null to hide.',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback fired when the modal is closed (Escape, backdrop click, or close button).',
    },
    renderLink: {
      description: 'Custom link renderer for SPA navigation (e.g., React Router Link)',
      table: {
        type: { summary: 'LinkRenderer' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickViewModal>;

/* =============================================================================
   STORY DEFINITIONS
   ============================================================================= */

/**
 * Default — In-stock product with full specification grid.
 */
export const Default: Story = {
  args: {
    product: inStockProduct,
  },
};

/**
 * PreOrder — Product that requires planning permission and is not yet in stock.
 */
export const PreOrder: Story = {
  args: {
    product: preOrderProduct,
  },
};

/**
 * MinimalData — Product with only required fields; no optional fields.
 */
export const MinimalData: Story = {
  args: {
    product: {
      size: '25m²',
      name: 'Garden Suite',
      image: 'https://via.placeholder.com/620x320/E5E7DE/333?text=25m²+Suite',
      useCases: [],
      available: true,
      description: 'A versatile garden room suitable for work and leisure.',
      specs: {},
      leadTime: '8–10 weeks',
      ctaLink: '/contact?product=garden-room-25',
    },
  },
};

/**
 * CustomCtaText — Product with a custom CTA button label.
 */
export const CustomCtaText: Story = {
  args: {
    product: {
      ...inStockProduct,
      ctaText: 'Book a Site Visit',
    },
  },
};
