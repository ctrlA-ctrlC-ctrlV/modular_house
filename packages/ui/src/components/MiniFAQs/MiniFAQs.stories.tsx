/**
 * MiniFAQs Component Storybook Stories
 * =============================================================================
 *
 * PURPOSE:
 * Provides Storybook stories for the MiniFAQs component, enabling visual
 * testing, documentation, and isolated development of component variants.
 *
 * STORY VARIANTS:
 * - Default: Standard FAQ section with flooring-related content
 * - WithClickHandler: Demonstrates interactive FAQ items with click events
 * - CustomTitle: Shows the component with a different section title
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MiniFAQs, FAQItem } from './MiniFAQs';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Defines the Storybook metadata for the component including title hierarchy,
   layout parameters, and default argTypes.
   ============================================================================= */

const meta: Meta<typeof MiniFAQs> = {
  title: 'Components/MiniFAQs',
  component: MiniFAQs,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Large decorative title displayed above the FAQ list',
    },
    faqs: {
      control: 'object',
      description: 'Array of FAQ items to render',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class for custom styling',
    },
    onFAQClick: {
      action: 'faqClicked',
      description: 'Callback fired when a FAQ item is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MiniFAQs>;

/* =============================================================================
   SAMPLE DATA
   -----------------------------------------------------------------------------
   Reusable sample FAQ items for story demonstrations.
   ============================================================================= */

const sampleFAQs: FAQItem[] = [
  {
    number: '01',
    title: 'It starts with floors',
    description:
      'At Rebar, we install and upgrade floor coverings that blend style, function, and durability. Our team delivers tailored solutions for homes and businesses, using top materials and expert care.',
  },
  {
    number: '02',
    title: 'Covering all flooring needs',
    description:
      "Rebar's floor covering services include hardwood, tile, carpet, and more. We guide you from selection to finish, ensuring your new floors are safe, stylish, and built to last.",
  },
  {
    number: '03',
    title: 'Handling all flooring needs',
    description:
      'We offer expert advice on floor coverings, from moisture control to heavy use areas. Our team ensures your floors meet every need, blending design, safety, and long-term value.',
  },
];

/* =============================================================================
   STORIES
   ============================================================================= */

/**
 * Default Story
 * Renders the MiniFAQs component with standard flooring-related content.
 */
export const Default: Story = {
  args: {
    title: 'Flooring',
    faqs: sampleFAQs,
  },
};

/**
 * WithClickHandler Story
 * Demonstrates the component with an interactive click handler on FAQ items.
 */
export const WithClickHandler: Story = {
  args: {
    title: 'Services',
    faqs: sampleFAQs,
    onFAQClick: (item: FAQItem, index: number) => {
      console.log(`FAQ clicked: ${item.title} at index ${index}`);
    },
  },
};

/**
 * CustomTitle Story
 * Shows the component with a custom decorative title.
 */
export const CustomTitle: Story = {
  args: {
    title: 'Modular',
    faqs: [
      {
        number: '01',
        title: 'Prefabricated excellence',
        description:
          'Our modular homes are built with precision in controlled factory environments, ensuring consistent quality and faster construction timelines.',
      },
      {
        number: '02',
        title: 'Sustainable by design',
        description:
          'Every modular unit is designed with sustainability in mind, utilizing eco-friendly materials and energy-efficient construction methods.',
      },
    ],
  },
};
