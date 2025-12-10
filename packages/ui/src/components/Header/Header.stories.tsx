import type { Meta, StoryObj } from '@storybook/react';
import { Header, type HeaderProps } from './Header';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

const defaultMenuItems: HeaderProps['menuItems'] = [
  {
    label: 'Home',
    href: '#',
    submenu: [
      { label: 'Home Builders', href: '#home-builders' },
      { label: 'Remodeling', href: '#remodeling' },
    ],
  },
  {
    label: 'Pages',
    href: '#',
    submenu: [
      { label: 'About Us', href: '#about' },
      { label: 'Services', href: '#services' },
      { label: 'Our Team', href: '#team' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    label: 'Portfolio',
    href: '#',
    submenu: [
      { label: 'Our Work', href: '#work' },
      { label: 'Project Details', href: '#details' },
    ],
  },
  {
    label: 'Blog',
    href: '#',
    submenu: [
      { label: 'Latest News', href: '#news' },
    ],
  },
  {
    label: 'Contact Us',
    href: '#contact-link', // This is the nav link version
  },
];

// Replicated the screenshot logo approximately using a placeholder
// In production, use your actual "rebar." image file
const logoUrl = 'https://via.placeholder.com/120x40/000000/FFFFFF?text=rebar.';

export const Default: Story = {
  args: {
    logoSrc: logoUrl,
    logoAlt: 'rebar.',
    menuItems: defaultMenuItems,
    ctaLabel: 'Contact Us', // The button on the right
    ctaHref: '#contact-button',
  },
};

export const MobileView: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const PositionOver: Story = {
  args: {
    ...Default.args,
    positionOver: true,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', minHeight: '500px' }}>
        {/* Background image to test transparency */}
        <div style={{ 
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80) center/cover no-repeat'
        }}></div>
        <Story />
        <div style={{ position: 'relative', zIndex: 1, padding: '150px 20px', color: 'white', textAlign: 'center' }}>
          <h1>Hero Content</h1>
          <p>Header should be transparent over this image.</p>
        </div>
      </div>
    ),
  ],
};