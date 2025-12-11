import type { Meta, StoryObj } from '@storybook/react';
import { TestimonialGrid } from './TestimonialGrid';

const meta: Meta<typeof TestimonialGrid> = {
  title: 'Components/TestimonialGrid',
  component: TestimonialGrid,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TestimonialGrid>;

export const Default: Story = {};

export const CustomContent: Story = {
  args: {
    subTitle: "Client Feedback",
    title: "What People Say About Us",
    testimonials: [
      {
        text: "Absolutely amazing service! Highly recommended.",
        authorName: "John Doe",
        authorLocation: "London, UK",
        authorImageSrc: "https://via.placeholder.com/150",
        rating: 5
      },
      {
        text: "Professional and timely. Great experience.",
        authorName: "Jane Smith",
        authorLocation: "New York, USA",
        authorImageSrc: "https://via.placeholder.com/150",
        rating: 4
      }
    ]
  },
};

