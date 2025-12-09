import type { Meta, StoryObj } from '@storybook/react';
import { MasonryGallery } from './MasonryGallery';

const meta: Meta<typeof MasonryGallery> = {
  title: 'Components/MasonryGallery',
  component: MasonryGallery,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MasonryGallery>;

export const Default: Story = {
  args: {
    columns: 4,
  },
};

export const ThreeColumns: Story = {
  args: {
    columns: 3,
  },
};
