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
    button2Text: "Need more info?"
  },
};

export const WhiteBackground: Story = {
  args: {
    backgroundColor: 'white',
    subtitle: "Clean Design",
    title: "Pure White Background",
    description1: "This section uses a clean white background for contrast.",
    button1Text: "Learn more",
    bottomText: "Perfect for sections that need to stand out.",
    button2Text: "Get in touch"
  },
};

export const GrayBackground: Story = {
  args: {
    backgroundColor: 'gray',
    subtitle: "Subtle Contrast",
    title: "Light Gray Background",
    description1: "This section uses a subtle gray background for gentle separation.",
    button1Text: "Explore options",
    bottomText: "Great for alternating sections and improved readability.",
    button2Text: "Contact us"
  },
};

export const DarkBackground: Story = {
  args: {
    backgroundColor: 'dark',
    subtitle: "Bold Statement",
    title: "Dark Background Theme",
    description1: "This section uses a dark background with light text for dramatic effect.",
    button1Text: "Discover more",
    bottomText: "Perfect for creating visual hierarchy and modern appeal.",
    button2Text: "Get started"
  },
};