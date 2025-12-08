import type { Meta, StoryObj } from '@storybook/react';
import { TwoMirrorSplitColumnLayout } from './TwoMirrorSplitColumnLayout';

const meta: Meta<typeof TwoMirrorSplitColumnLayout> = {
  title: 'Components/TwoMirrorSplitColumnLayout',
  component: TwoMirrorSplitColumnLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TwoMirrorSplitColumnLayout>;

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