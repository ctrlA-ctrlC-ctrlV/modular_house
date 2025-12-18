import type { Meta, StoryObj } from '@storybook/react';
import { HeroBoldBottomText } from './HeroBoldBottomText';

/**
 * Storybook metadata for the HeroBoldBottomText component.
 * Configures the component within the Storybook sidebar and sets the layout to fullscreen 
 * to accurately represent hero behavior.
 */
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

/**
 * Default story demonstrating the standard configuration of the hero section
 * with default remodeling copy and background.
 */
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

/**
 * Variation demonstrating the component's flexibility with different textual 
 * content and thematic background images.
 */
export const CustomContent: Story = {
  args: {
    titleLine1: "Build your dream home.",
    titleLine2: "Quality craftsmanship guaranteed.",
    ctaText: "Contact Us",
    bigText: "Construction",
    backgroundImage: "https://rebar.themerex.net/wp-content/uploads/2025/08/background-04.jpg",
  },
};