import type { Meta, StoryObj } from '@storybook/react';
import { TwoColumnSplitLayout } from './TwoColumnSplitLayout';

const meta: Meta<typeof TwoColumnSplitLayout> = {
  title: 'Components/TwoColumnSplitLayout',
  component: TwoColumnSplitLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TwoColumnSplitLayout>;

export const Default: Story = {};

export const CustomContent: Story = {
  args: {
    subtitle: "Our Mission",
    title: "Building the Future Together",
    description1: "We are committed to sustainable construction practices.",
    button1Text: "Every project is an opportunity to innovate and improve our community.",
    bottomText: "Join us in creating a better world through better buildings.",
    button2Text: "Need more info?dfd"
  },
};