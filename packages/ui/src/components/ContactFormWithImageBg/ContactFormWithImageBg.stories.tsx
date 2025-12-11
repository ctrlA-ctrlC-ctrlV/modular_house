import type { Meta, StoryObj } from '@storybook/react';
import { ContactFormWithImageBg } from './ContactFormWithImageBg';

const meta: Meta<typeof ContactFormWithImageBg> = {
  title: 'Components/ContactFormWithImageBg',
  component: ContactFormWithImageBg,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContactFormWithImageBg>;

export const Default: Story = {
  args: {
    // Matches the default layout shown in the screenshot
    title: "Have questions?\nGet in touch!",
  }
};

export const CustomTitle: Story = {
  args: {
    title: "Contact Our\nSales Team",
  },
};

export const CustomBackground: Story = {
  args: {
    // You can replace this with a local image or different URL to test positioning
    backgroundImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80", 
  },
};