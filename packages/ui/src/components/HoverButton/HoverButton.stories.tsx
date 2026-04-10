/**
 * HoverButton Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the HoverButton component,
 * enabling isolated development, visual testing, and interactive
 * documentation of all supported states and configurations.
 *
 * STORY STRUCTURE:
 * - Default:          Standard bottom-placement popover with text content
 * - TopPlacement:     Popover rendered above the trigger
 * - RichContent:      Popover containing structured HTML content
 * - CustomDelay:      Demonstrates configurable open/close delays
 * - InlineWithText:   Shows the button used inline within a paragraph
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { HoverButton } from './HoverButton';


/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Storybook meta configuration defining component defaults, controls,
   and documentation description.
   ============================================================================= */

const meta: Meta<typeof HoverButton> = {
  title: 'Components/HoverButton',
  component: HoverButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An Apple-style informational hover button displaying a circled "i" icon (U+24D8). ' +
          'On hover, a popover card appears with a smooth scale + fade animation and a directional ' +
          'arrow pointing toward the trigger. The popover automatically flips above the trigger ' +
          'when viewport space below is insufficient.',
      },
    },
  },
  argTypes: {
    placement: {
      control: { type: 'radio' },
      options: ['top', 'bottom'],
      description: 'Preferred popover placement relative to the trigger icon.',
    },
    openDelay: {
      control: { type: 'number', min: 0, max: 1000, step: 10 },
      description: 'Delay in milliseconds before the popover appears.',
    },
    closeDelay: {
      control: { type: 'number', min: 0, max: 1000, step: 10 },
      description: 'Delay in milliseconds before the popover closes.',
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible label for the trigger button.',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS class names for the root element.',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HoverButton>;


/* =============================================================================
   STORIES
   -----------------------------------------------------------------------------
   Individual story definitions demonstrating various component configurations.
   ============================================================================= */

/**
 * Default story: bottom-placement popover with simple text content.
 * Hover over the circled "i" icon to reveal the popover.
 */
export const Default: Story = {
  args: {
    ariaLabel: 'More about garden rooms',
    children: 'All our garden rooms include 100mm Kingspan insulation as standard, ensuring year-round comfort.',
  },
};

/**
 * TopPlacement story: popover rendered above the trigger icon.
 * Useful when the trigger is positioned near the bottom of a viewport.
 */
export const TopPlacement: Story = {
  args: {
    placement: 'top',
    ariaLabel: 'Warranty information',
    children: 'Every garden room comes with a 10-year structural warranty covering the steel frame and all major components.',
  },
  decorators: [
    (StoryComponent) => (
      <div style={{ marginTop: '240px' }}>
        <StoryComponent />
      </div>
    ),
  ],
};

/**
 * RichContent story: popover containing structured HTML content with
 * headings, paragraphs, and lists. Demonstrates the component's
 * flexibility in rendering complex React children.
 */
export const RichContent: Story = {
  args: {
    ariaLabel: 'Planning permission details',
    children: (
      <div>
        <strong style={{ display: 'block', marginBottom: '6px' }}>Planning Permission</strong>
        <p>Under current Irish law, garden rooms up to 25m2 are generally exempt from planning permission.</p>
        <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.8125rem' }}>
          <li>Must not exceed 4m in height</li>
          <li>Must be to the rear of the property</li>
          <li>Must not reduce open space below 25m2</li>
        </ul>
      </div>
    ),
  },
};

/**
 * CustomDelay story: demonstrates configurable open and close delays.
 * The popover appears after 300ms and closes after 400ms, providing
 * a more deliberate interaction pattern.
 */
export const CustomDelay: Story = {
  args: {
    openDelay: 300,
    closeDelay: 400,
    ariaLabel: 'Delivery information',
    children: 'Standard delivery takes 4-6 weeks from order confirmation. Express delivery options are available for select models.',
  },
};

/**
 * InlineWithText story: shows the HoverButton used inline within a
 * paragraph of text, demonstrating its compact footprint and
 * natural integration with surrounding content.
 */
export const InlineWithText: Story = {
  render: () => (
    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', lineHeight: 1.6, maxWidth: '480px' }}>
      Our premium garden rooms start from EUR 12,500{' '}
      <HoverButton ariaLabel="Price breakdown">
        Base price includes the steel frame structure, insulation, internal lining, and standard electrical package.
        Foundation works and site preparation are quoted separately.
      </HoverButton>{' '}
      and can be customised to suit your exact requirements.
    </p>
  ),
};
