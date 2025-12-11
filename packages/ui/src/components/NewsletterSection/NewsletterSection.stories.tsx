import type { Meta, StoryObj } from '@storybook/react';
import { NewsletterSection } from './NewsletterSection';

const meta: Meta<typeof NewsletterSection> = {
  title: 'Components/NewsletterSection',
  component: NewsletterSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NewsletterSection>;

export const Default: Story = {
  args: {
    title: 'Get the best blog stories into inbox!',
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Subscribe to our Weekly Newsletter',
  },
};
