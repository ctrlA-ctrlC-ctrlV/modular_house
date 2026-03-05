import type { Meta, StoryObj } from '@storybook/react';
import { InfiniteMasonryGallery, type InfiniteGalleryImage } from './InfiniteMasonryGallery';

const sampleImages: InfiniteGalleryImage[] = [
  { id: 1, src: 'https://picsum.photos/seed/a1/400/260', orientation: 'landscape', alt: 'Landscape image 1' },
  { id: 2, src: 'https://picsum.photos/seed/b2/260/520', orientation: 'portrait', alt: 'Portrait image 2' },
  { id: 3, src: 'https://picsum.photos/seed/c3/380/260', orientation: 'landscape', alt: 'Landscape image 3' },
  { id: 4, src: 'https://picsum.photos/seed/d4/340/260', orientation: 'landscape', alt: 'Landscape image 4' },
  { id: 5, src: 'https://picsum.photos/seed/e5/260/520', orientation: 'portrait', alt: 'Portrait image 5' },
  { id: 6, src: 'https://picsum.photos/seed/f6/420/260', orientation: 'landscape', alt: 'Landscape image 6' },
  { id: 7, src: 'https://picsum.photos/seed/g7/360/260', orientation: 'landscape', alt: 'Landscape image 7' },
  { id: 8, src: 'https://picsum.photos/seed/h8/260/520', orientation: 'portrait', alt: 'Portrait image 8' },
  { id: 9, src: 'https://picsum.photos/seed/i9/400/260', orientation: 'landscape', alt: 'Landscape image 9' },
  { id: 10, src: 'https://picsum.photos/seed/j10/350/260', orientation: 'landscape', alt: 'Landscape image 10' },
  { id: 11, src: 'https://picsum.photos/seed/k11/390/260', orientation: 'landscape', alt: 'Landscape image 11' },
  { id: 12, src: 'https://picsum.photos/seed/l12/260/520', orientation: 'portrait', alt: 'Portrait image 12' },
  { id: 13, src: 'https://picsum.photos/seed/m13/370/260', orientation: 'landscape', alt: 'Landscape image 13' },
  { id: 14, src: 'https://picsum.photos/seed/n14/410/260', orientation: 'landscape', alt: 'Landscape image 14' },
  { id: 15, src: 'https://picsum.photos/seed/o15/330/260', orientation: 'landscape', alt: 'Landscape image 15' },
  { id: 16, src: 'https://picsum.photos/seed/p16/260/520', orientation: 'portrait', alt: 'Portrait image 16' },
  { id: 17, src: 'https://picsum.photos/seed/q17/380/260', orientation: 'landscape', alt: 'Landscape image 17' },
  { id: 18, src: 'https://picsum.photos/seed/r18/360/260', orientation: 'landscape', alt: 'Landscape image 18' },
];

const meta: Meta<typeof InfiniteMasonryGallery> = {
  title: 'Components/InfiniteMasonryGallery',
  component: InfiniteMasonryGallery,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    rowHeight: {
      control: { type: 'range', min: 120, max: 400, step: 10 },
      description: 'Height of a single row in pixels',
    },
    gap: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'Gap between items in pixels',
    },
    friction: {
      control: { type: 'range', min: 0.8, max: 0.99, step: 0.01 },
      description: 'Momentum friction (higher = longer slide)',
    },
    lightbox: {
      control: 'boolean',
      description: 'Enable lightbox on click',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfiniteMasonryGallery>;

export const Default: Story = {
  args: {
    images: sampleImages,
    title: 'Gallery',
    eyebrow: 'Collection',
  },
};

export const WithCustomDimensions: Story = {
  args: {
    images: sampleImages,
    title: 'Our Work',
    eyebrow: 'Portfolio',
    rowHeight: 180,
    gap: 10,
  },
};

export const NoHeader: Story = {
  args: {
    images: sampleImages,
  },
};

export const LightboxDisabled: Story = {
  args: {
    images: sampleImages,
    title: 'Browse Only',
    eyebrow: 'Gallery',
    lightbox: false,
  },
};

export const FewImages: Story = {
  args: {
    images: sampleImages.slice(0, 5),
    title: 'Small Set',
    eyebrow: 'Preview',
  },
};
