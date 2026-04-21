/**
 * TextIntroSection Stories
 * =============================================================================
 *
 * Storybook story definitions for the TextIntroSection component. Provides
 * interactive controls for all props and demonstrates the component across
 * multiple content configurations: default production content, a single
 * paragraph variant, and an edge case with no paragraphs.
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TextIntroSection } from './TextIntroSection';


/* =============================================================================
   Story Meta Configuration
   =============================================================================
   Registers the TextIntroSection under the "Components" sidebar group and
   enables automatic documentation generation via the 'autodocs' tag. The
   'fullscreen' layout parameter removes Storybook's default padding so the
   section renders at its natural full-width dimensions.
   ============================================================================= */
const meta: Meta<typeof TextIntroSection> = {
  title: 'Components/TextIntroSection',
  component: TextIntroSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Centred editorial introduction section with an eyebrow label, display heading, body paragraphs, and a decorative divider. Designed for service and product page introductions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    eyebrow: {
      control: 'text',
      description:
        'Uppercase label displayed between decorative horizontal rules.',
    },
    title: {
      control: 'text',
      description: 'Section heading rendered as an h2 in display/serif font.',
    },
    paragraphs: {
      control: 'object',
      description:
        'Array of body paragraph strings. Each string becomes its own <p> element.',
    },
    className: {
      control: 'text',
      description:
        'Optional CSS class appended to the root <section> element for layout or background overrides.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextIntroSection>;


/* =============================================================================
   Story: Default
   =============================================================================
   Demonstrates the TextIntroSection with production-representative content
   matching the house extensions page context. Two body paragraphs establish
   the editorial tone before the feature sections.
   ============================================================================= */
export const Default: Story = {
  args: {
    eyebrow: 'WHY HOUSE EXTENSIONS',
    title: 'Your Space. Your Vision.',
    paragraphs: [
      'Whether you are envisioning a light-filled open-plan kitchen, a dedicated home office, or an expansive master suite, a well-executed house extension is the ultimate way to transform your living experience without the upheaval of moving.',
      'In Dublin, where architectural heritage meets modern living demands, our extensions are meticulously designed to respect the original structure while injecting contemporary functionality and cutting-edge energy efficiency.',
    ],
  },
};


/* =============================================================================
   Story: SingleParagraph
   =============================================================================
   Demonstrates the component with a single body paragraph to verify visual
   balance when less content is provided.
   ============================================================================= */
export const SingleParagraph: Story = {
  args: {
    eyebrow: 'OUR APPROACH',
    title: 'Precision Engineering Meets Modern Design.',
    paragraphs: [
      'Every extension we build starts with a detailed consultation to understand your vision, your space, and your budget. From there, our architects and engineers collaborate to deliver a solution that exceeds expectations.',
    ],
  },
};


/* =============================================================================
   Story: NoParagraphs
   =============================================================================
   Demonstrates the component with an empty paragraphs array. Verifies that the
   eyebrow, heading, and bottom divider render correctly without a body container.
   This edge case covers scenarios where only a heading introduction is required.
   ============================================================================= */
export const NoParagraphs: Story = {
  args: {
    eyebrow: 'COMING SOON',
    title: 'Something Exciting Is on the Way.',
    paragraphs: [],
  },
};


/* =============================================================================
   Story: WithCustomClassName
   =============================================================================
   Demonstrates the className prop by applying a custom background colour. This
   story validates that consumer-provided CSS classes are correctly appended to
   the root <section> element.
   ============================================================================= */
export const WithCustomClassName: Story = {
  args: {
    eyebrow: 'WHY GARDEN ROOMS',
    title: 'Your Garden. Your Retreat.',
    paragraphs: [
      'A garden room is more than an outbuilding. It is an investment in your lifestyle, your property value, and your daily wellbeing.',
    ],
    className: 'custom-bg-demo',
  },
  decorators: [
    (Story) => (
      <>
        <style>{`.custom-bg-demo { background-color: #F6F5F0; }`}</style>
        <Story />
      </>
    ),
  ],
};
