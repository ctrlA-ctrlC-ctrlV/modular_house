import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';

/**
 * Storybook configuration for the Footer component.
 * Configured for fullscreen layout to properly visualize the dark background.
 */
const meta = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: { 
      control: 'text',
      description: 'Optional CSS class for external styling overrides'
    },
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default presentation of the Footer.
 * Shows the component in its idle state.
 */
export const Default: Story = {
  args: {},
};