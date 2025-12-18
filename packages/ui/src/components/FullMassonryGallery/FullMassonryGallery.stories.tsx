import type { Meta, StoryObj } from '@storybook/react';
import { FullMassonryGallery } from './FullMassonryGallery';

/**
 * Metadata configuration for the FullMassonryGallery component documentation.
 */
const meta: Meta<typeof FullMassonryGallery> = {
  title: 'Components/FullMassonryGallery',
  component: FullMassonryGallery,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FullMassonryGallery>;

/**
 * Default story demonstrating the gallery with standard configuration.
 */
export const Default: Story = {
  args: {
    itemCount: 8,
  },
};

/**
 * Story demonstrating the component with a custom dataset and specific height variations
 * to showcase the masonry layout capabilities.
 */
export const ScreenshotComparison: Story = {
  args: {
    itemCount: 8,
    title: "Our Projects",
    description: "We are committed to working with our partners and customers to develop products that make a difference in the world.",
    items: [
      { imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop', title: 'Studio Gear', category: 'Photography' },
      { imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=900&fit=crop', title: 'Volcano Peak', category: 'Nature' },
      { imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop', title: 'Forest Trail', category: 'Adventure' },
      { imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=900&fit=crop', title: 'Winding Road', category: 'Travel' },
      { imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&h=700&fit=crop', title: 'Minimalist Interior', category: 'Design' },
      { imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=900&fit=crop', title: 'Autumn Park', category: 'Nature' },
      { imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&h=400&fit=crop', title: 'Morning Clock', category: 'Lifestyle' },
      { imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c02?w=600&h=400&fit=crop', title: 'Creative Workspace', category: 'Design' },
    ],
  },
};