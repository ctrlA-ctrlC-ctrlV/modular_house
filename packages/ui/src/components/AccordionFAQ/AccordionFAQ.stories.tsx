/**
 * AccordionFAQ Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the AccordionFAQ component,
 * enabling isolated development, visual testing, and documentation.
 *
 * STORY STRUCTURE:
 * - Default: Typical FAQ section with multiple items
 * - WithoutTitle: FAQ section without a heading
 * - SingleItem: Edge case with only one FAQ item
 * - ManyItems: Stress test with many FAQ items
 * - WithToggleCallback: Demonstrates the onToggle callback functionality
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AccordionFAQ, AccordionFAQItem } from './AccordionFAQ';

/* =============================================================================
   SAMPLE DATA
   -----------------------------------------------------------------------------
   Reusable FAQ item data for story demonstrations.
   ============================================================================= */

const sampleFAQs: AccordionFAQItem[] = [
  {
    id: 'faq-1',
    number: '01',
    title: 'Do I need planning permission for a garden room?',
    description:
      'In most cases, garden rooms fall under Permitted Development rights and do not require planning permission. However, there are size and placement restrictions. We recommend checking with your local planning authority or consulting with us for guidance specific to your property.',
  },
  {
    id: 'faq-2',
    number: '02',
    title: 'How long does installation take?',
    description:
      'Our modular garden rooms are typically installed within 1-2 days, depending on the size and complexity. The foundations and groundwork may require an additional 1-2 days of preparation. We will provide a detailed timeline during your consultation.',
  },
  {
    id: 'faq-3',
    number: '03',
    title: 'What is included in the price?',
    description:
      'Our prices include the complete garden room structure, roof, doors, windows, insulation, internal lining, electrical wiring with sockets and lighting, and external cladding. Foundations, landscaping, and any bespoke additions are quoted separately.',
  },
  {
    id: 'faq-4',
    number: '04',
    title: 'Can I use the garden room all year round?',
    description:
      'Absolutely! All our garden rooms are fully insulated to meet modern building standards, making them comfortable in both summer and winter. With proper heating, you can use your garden room as a home office, studio, or living space throughout the year.',
  },
  {
    id: 'faq-5',
    number: '05',
    title: 'What warranty do you offer?',
    description:
      'We provide a 10-year structural warranty on all our garden rooms, covering the steel frame and major components. Additionally, windows, doors, and electrical installations come with their own manufacturer warranties. Full warranty details are provided with your purchase documentation.',
  },
];

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Storybook meta configuration defining component defaults and documentation.
   ============================================================================= */

const meta: Meta<typeof AccordionFAQ> = {
  title: 'Components/AccordionFAQ',
  component: AccordionFAQ,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An accessible, expandable/collapsible FAQ section. Each FAQ item can be independently toggled open or closed. Multiple items can be open simultaneously.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Optional section heading rendered as an h2 above the FAQ list',
    },
    faqs: {
      control: 'object',
      description: 'Array of AccordionFAQItem objects to render in the accordion',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class name appended to the section wrapper for styling extensions',
    },
    onToggle: {
      action: 'toggled',
      description: 'Optional callback fired when an FAQ item is toggled open or closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccordionFAQ>;

/* =============================================================================
   STORY DEFINITIONS
   ============================================================================= */

/**
 * Default Story
 * Renders a typical FAQ section with multiple expandable items.
 */
export const Default: Story = {
  args: {
    title: 'Frequently Asked Questions',
    faqs: sampleFAQs,
  },
};

/**
 * Without Title Story
 * Demonstrates the FAQ section without a heading, useful when embedded
 * within a parent section that already provides a heading.
 */
export const WithoutTitle: Story = {
  args: {
    faqs: sampleFAQs,
  },
};

/**
 * Single Item Story
 * Edge case demonstrating a single FAQ item.
 */
export const SingleItem: Story = {
  args: {
    title: 'Quick Answer',
    faqs: [sampleFAQs[0]],
  },
};

/**
 * Many Items Story
 * Stress test with many FAQ items to verify scroll and performance behaviour.
 */
export const ManyItems: Story = {
  args: {
    title: 'Complete FAQ',
    faqs: [
      ...sampleFAQs,
      {
        id: 'faq-6',
        number: '06',
        title: 'What foundation options are available?',
        description:
          'We offer several foundation options including concrete pads, screw piles, and raised deck foundations. The best choice depends on your site conditions, local regulations, and preferences. Our team will assess your garden and recommend the most suitable option.',
      },
      {
        id: 'faq-7',
        number: '07',
        title: 'Can I customise the interior layout?',
        description:
          'Yes, we offer a range of customisation options for interior layouts. Whether you need a partition wall, additional electrical points, or specific window placements, we can work with you to create a space that meets your exact requirements.',
      },
      {
        id: 'faq-8',
        number: '08',
        title: 'How do I maintain my garden room?',
        description:
          'Garden rooms require minimal maintenance. We recommend annually checking seals around windows and doors, cleaning gutters, and inspecting the external cladding. The steel frame is maintenance-free and designed to last for decades.',
      },
      {
        id: 'faq-9',
        number: '09',
        title: 'Do you provide financing options?',
        description:
          'Yes, we partner with several finance providers to offer flexible payment plans. Subject to status, you can spread the cost of your garden room over 12 to 60 months. Contact us for a personalised quote and financing options.',
      },
      {
        id: 'faq-10',
        number: '10',
        title: 'What areas do you cover for installation?',
        description:
          'We currently install garden rooms throughout England and Wales. Delivery and installation costs may vary depending on your location. Please contact us with your postcode for a delivery quote and to confirm availability in your area.',
      },
    ],
  },
};

/**
 * With Custom Class Story
 * Demonstrates the className prop for applying custom styles.
 */
export const WithCustomClass: Story = {
  args: {
    title: 'Styled FAQ Section',
    faqs: sampleFAQs.slice(0, 3),
    className: 'custom-faq-section',
  },
};
