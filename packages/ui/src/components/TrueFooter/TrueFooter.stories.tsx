import type { Meta, StoryObj } from '@storybook/react';
import { TrueFooter } from './TrueFooter';

const meta = {
  title: 'Components/TrueFooter',
  component: TrueFooter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    copyrightText: { control: 'text' },
    siteByText: { control: 'text' },
    siteByLinkText: { control: 'text' },
    siteByLinkUrl: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof TrueFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    copyrightText: '© 2025. All Rights Reserved.',
    siteByText: 'Site by',
    siteByLinkText: 'ThemeRex.',
    siteByLinkUrl: 'https://themerex.net/',
  },
};

export const CustomCopyright: Story = {
  args: {
    copyrightText: '© 2025 Modular House. All Rights Reserved.',
    siteByText: 'Designed by',
    siteByLinkText: 'Modular Team',
    siteByLinkUrl: '#',
  },
};
