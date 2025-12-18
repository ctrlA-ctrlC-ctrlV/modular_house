import type { Meta, StoryObj } from '@storybook/react';
import { HeroBoldBottomText } from './HeroBoldBottomText';

const meta: Meta<typeof HeroBoldBottomText> = {
  title: 'Components/HeroBoldBottomText',
  component: HeroBoldBottomText,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HeroBoldBottomText>;

export const Default: Story = {
  args: {
    titleLine1: "Transform your living spaces with our expert building team.",
    titleLine2: "We create projects tailored to your vision.",
    ctaText: "Get Started",
    ctaLink: "#",
    bigText: "Remodeling",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-06.jpg",
  },
};

export const CustomContent: Story = {
  args: {
    titleLine1: "Build your dream home.",
    titleLine2: "Quality craftsmanship guaranteed.",
    ctaText: "Contact Us",
    bigText: "Construction",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  },
};
