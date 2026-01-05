/**
 * TestimonialGrid Storybook Stories
 * =============================================================================
 *
 * This file defines Storybook stories for the TestimonialGrid component,
 * enabling isolated development, visual testing, and documentation.
 *
 * STORY STRUCTURE:
 * - Default: Component with default props for baseline behavior
 * - CustomContent: Demonstrates custom testimonial data injection
 * - WithClickHandler: Shows interactive callback functionality
 * - MinimalTestimonials: Edge case with fewer than visible items
 *
 * =============================================================================
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TestimonialGrid, TestimonialItem } from './TestimonialGrid';

/* =============================================================================
   META CONFIGURATION
   -----------------------------------------------------------------------------
   Storybook meta configuration defining component defaults and documentation.
   ============================================================================= */

const meta: Meta<typeof TestimonialGrid> = {
  title: 'Components/TestimonialGrid',
  component: TestimonialGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A responsive testimonial carousel displaying client feedback with horizontal scroll and dot pagination.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    subTitle: {
      control: 'text',
      description: 'Eyebrow text displayed above the main title',
    },
    title: {
      control: 'text',
      description: 'Primary heading for the testimonial section',
    },
    testimonials: {
      control: 'object',
      description: 'Array of testimonial items to display',
    },
    className: {
      control: 'text',
      description: 'Optional CSS class for custom styling',
    },
    onTestimonialClick: {
      action: 'clicked',
      description: 'Callback fired when a testimonial card is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TestimonialGrid>;

/* =============================================================================
   STORY DEFINITIONS
   ============================================================================= */

/**
 * Default Story
 * Renders the component with all default prop values to showcase baseline behavior.
 */
export const Default: Story = {};

/**
 * Custom Content Story
 * Demonstrates the component with custom testimonial data and modified titles.
 */
export const CustomContent: Story = {
  args: {
    subTitle: 'Client Feedback',
    title: 'What People Say About Us',
    testimonials: [
      {
        text: 'Absolutely amazing service! Highly recommended.',
        authorName: 'John Doe',
        authorLocation: 'London, UK',
        authorImageSrc: 'https://via.placeholder.com/150',
        rating: 5,
      },
      {
        text: 'Professional and timely. Great experience.',
        authorName: 'Jane Smith',
        authorLocation: 'New York, USA',
        authorImageSrc: 'https://via.placeholder.com/150',
        rating: 4,
      },
      {
        text: 'The team went above and beyond our expectations.',
        authorName: 'Michael Brown',
        authorLocation: 'Sydney, AU',
        authorImageSrc: 'https://via.placeholder.com/150',
        rating: 5,
      },
    ] as TestimonialItem[],
  },
};

/**
 * With Click Handler Story
 * Demonstrates interactive click handling on testimonial cards.
 */
export const WithClickHandler: Story = {
  args: {
    subTitle: 'Interactive Cards',
    title: 'Click a Testimonial',
    onTestimonialClick: (item: TestimonialItem, index: number) => {
      console.log(`Clicked testimonial ${index}:`, item.authorName);
    },
  },
};

/**
 * Minimal Testimonials Story
 * Edge case with fewer items than the visible count to verify dot behavior.
 */
export const MinimalTestimonials: Story = {
  args: {
    subTitle: 'Limited Reviews',
    title: 'Our First Clients',
    testimonials: [
      {
        text: 'Excellent work on our project.',
        authorName: 'Alice Johnson',
        authorLocation: 'Toronto, CA',
        authorImageSrc: 'https://via.placeholder.com/150',
        rating: 5,
      },
      {
        text: 'Very satisfied with the results.',
        authorName: 'Bob Williams',
        authorLocation: 'Chicago, USA',
        authorImageSrc: 'https://via.placeholder.com/150',
        rating: 5,
      },
    ] as TestimonialItem[],
  },
};

