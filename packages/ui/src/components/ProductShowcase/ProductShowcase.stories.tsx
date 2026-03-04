/**
 * ProductShowcase Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides interactive documentation and visual testing for the ProductShowcase
 * component. The Default story mirrors the garden room product line data.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ProductShowcase } from './ProductShowcase';
import type {
  ProductShowcaseProduct,
  ProductShowcaseFeature,
  ProductShowcaseWarranty,
} from './ProductShowcase';

/* =============================================================================
   SAMPLE DATA
   ============================================================================= */

const sampleProducts: ProductShowcaseProduct[] = [
  {
    id: 'compact-15',
    size: '15',
    unit: 'm²',
    dimensions: '5.0m × 3.0m',
    price: 'From €24,950',
    label: 'The Compact',
    permitFree: true,
    imageSrc: '/resource/garden-room/garden-room1.png',
    imageWebP: '/resource/garden-room/garden-room1.webp',
    imageAvif: '/resource/garden-room/garden-room1.avif',
    imageAlt: 'The Compact 15m² garden room',
  },
  {
    id: 'studio-25',
    size: '25',
    unit: 'm²',
    dimensions: '6.25m × 4.0m',
    price: 'From €37,500',
    label: 'The Studio',
    permitFree: true,
    imageSrc: '/resource/garden-room/garden-room2.png',
    imageWebP: '/resource/garden-room/garden-room2.webp',
    imageAvif: '/resource/garden-room/garden-room2.avif',
    imageAlt: 'The Studio 25m² garden room',
  },
  {
    id: 'living-35',
    size: '35',
    unit: 'm²',
    dimensions: '7.0m × 5.0m',
    price: 'From €49,950',
    label: 'The Living',
    permitFree: false,
    imageSrc: '/resource/garden-room/garden-room3.png',
    imageWebP: '/resource/garden-room/garden-room3.webp',
    imageAvif: '/resource/garden-room/garden-room3.avif',
    imageAlt: 'The Living 35m² garden room',
  },
  {
    id: 'grand-45',
    size: '45',
    unit: 'm²',
    dimensions: '9.0m × 5.0m',
    price: 'From €64,500',
    label: 'The Grand',
    permitFree: false,
    imageSrc: '/resource/garden-room/garden-room4.png',
    imageWebP: '/resource/garden-room/garden-room4.webp',
    imageAvif: '/resource/garden-room/garden-room4.avif',
    imageAlt: 'The Grand 45m² garden room',
  },
];

const sampleFeatures: ProductShowcaseFeature[] = [
  {
    icon: '◆',
    title: 'Steel Frame Construction',
    desc: 'Galvanised structural steel for unmatched durability and longevity.',
  },
  {
    icon: '◆',
    title: 'Full Insulation Package',
    desc: 'High-performance PIR insulation exceeding Part L building regulations.',
  },
  {
    icon: '◆',
    title: 'Electrical Fit-Out',
    desc: 'Certified RECI electrical installation with consumer unit included.',
  },
  {
    icon: '◆',
    title: 'Aluminium Windows & Doors',
    desc: 'Thermally broken, double-glazed aluminium frames in anthracite grey.',
  },
  {
    icon: '◆',
    title: 'Composite Cladding',
    desc: 'Low maintenance external cladding with a 25-year colour guarantee.',
  },
];

const sampleWarranties: ProductShowcaseWarranty[] = [
  { years: '20', label: 'Structural Warranty', sub: 'Steel frame & foundations' },
  { years: '25', label: 'Cladding Guarantee', sub: 'Colour & weather resistance' },
  { years: '10', label: 'Roof Membrane', sub: 'Watertight assurance' },
  { years: '10', label: 'Windows & Doors', sub: 'Thermal & mechanical' },
];

const sampleLegislationNote = (
  <p>
    <strong>Legislation Update:</strong>{' '}
    Rooms up to 25m² currently exempt from planning permission. Pending
    legislation will raise this to 45m² — making our full range permit-free.
  </p>
);

/* =============================================================================
   META CONFIGURATION
   ============================================================================= */

const meta: Meta<typeof ProductShowcase> = {
  title: 'Components/ProductShowcase',
  component: ProductShowcase,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    productEyebrow: {
      control: 'text',
      description: 'Eyebrow text above the product grid.',
    },
    scrollTargetId: {
      control: 'text',
      description: 'DOM element ID to smooth-scroll to when a product row is clicked.',
    },
    featuresEyebrow: {
      control: 'text',
      description: 'Eyebrow text above the features list.',
    },
    warrantyEyebrow: {
      control: 'text',
      description: 'Eyebrow text above the warranties grid.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ProductShowcase>;

/* =============================================================================
   STORIES
   ============================================================================= */

/**
 * Default Story
 *
 * Full garden room product showcase with all four sizes,
 * five standard features, and four warranty cards.
 */
export const Default: Story = {
  args: {
    products: sampleProducts,
    features: sampleFeatures,
    warranties: sampleWarranties,
    legislationNote: sampleLegislationNote,
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        {/* Scroll target for demo purposes */}
        <section
          id="product-range"
          style={{
            padding: '80px 40px',
            background: '#F6F5F0',
            borderTop: '1px solid #E5E7DE',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#888', fontStyle: 'italic' }}>
            ↑ Clicking a product row scrolls here (product-range target)
          </p>
        </section>
      </>
    ),
  ],
};

/**
 * Without Legislation Note
 *
 * Demonstrates the component without the legislation callout.
 */
export const WithoutLegislation: Story = {
  args: {
    products: sampleProducts,
    features: sampleFeatures,
    warranties: sampleWarranties,
  },
};

/**
 * Custom Eyebrows
 *
 * Demonstrates customised eyebrow labels.
 */
export const CustomEyebrows: Story = {
  args: {
    productEyebrow: 'Our Collection',
    featuresEyebrow: 'What You Get',
    warrantyEyebrow: 'Peace of Mind',
    products: sampleProducts,
    features: sampleFeatures,
    warranties: sampleWarranties,
    legislationNote: sampleLegislationNote,
  },
};
