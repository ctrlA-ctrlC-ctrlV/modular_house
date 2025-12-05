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
      { label: 'Handyman', href: '#handyman' },
      { label: 'Kitchens', href: '#kitchens' },
      { label: 'Doors & Windows', href: '#doors-windows' },
      { label: 'Roofing', href: '#roofing' },
      { label: 'Flooring', href: '#flooring' },
    ],
  },
  {
    label: 'Pages',
    href: '#',
    submenu: [
      { label: 'About Us', href: '#about' },
      { label: 'Services — 1', href: '#services-1' },
      { label: 'Services — 2', href: '#services-2' },
      { label: 'Testimonials — 1', href: '#testimonials-1' },
      { label: 'Testimonials — 2', href: '#testimonials-2' },
      { label: 'Our Team', href: '#team' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQs', href: '#faqs' },
    ],
  },
  {
    label: 'Portfolio',
    href: '#',
    submenu: [
      { label: 'Our Work — 1', href: '#work-1' },
      { label: 'Our Work — 2', href: '#work-2' },
      { label: 'Our Work — 3', href: '#work-3' },
      { label: 'Project Details', href: '#project-details' },
    ],
  },
  {
    label: 'Blog',
    href: '#',
    submenu: [
      { label: 'Blog — Standard', href: '#blog-standard' },
      { label: 'Blog — Grid', href: '#blog-grid' },
      { label: 'Post — With Sidebar', href: '#post-sidebar' },
      { label: 'Post — Without Sidebar', href: '#post-no-sidebar' },
    ],
  },
  {
    label: 'Contact Us',
    href: '#contact',
  },
];

const defaultSocialLinks: HeaderProps['socialLinks'] = [
  { platform: 'twitter', url: 'https://twitter.com' },
  { platform: 'instagram', url: 'https://instagram.com' },
];

export const Default: Story = {
  args: {
    logoSrc: 'https://via.placeholder.com/90x28/B55329/FFFFFF?text=Logo',
    logoSrcRetina: 'https://via.placeholder.com/180x56/B55329/FFFFFF?text=Logo@2x',
    logoAlt: 'Company Logo',
    logoHref: '/',
    menuItems: defaultMenuItems,
    socialLinks: defaultSocialLinks,
    positionOver: false,
  },
};

export const PositionOver: Story = {
  args: {
    ...Default.args,
    positionOver: true,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', minHeight: '400px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Story />
        <div style={{ padding: '100px 20px', color: 'white', textAlign: 'center' }}>
          <h1>Header positioned over content</h1>
          <p>This demonstrates the header with transparent background over page content</p>
        </div>
      </div>
    ),
  ],
};

export const NoSocial: Story = {
  args: {
    ...Default.args,
    socialLinks: [],
  },
};

export const SimpleMenu: Story = {
  args: {
    logoSrc: 'https://via.placeholder.com/90x28/B55329/FFFFFF?text=Logo',
    logoAlt: 'Company Logo',
    logoHref: '/',
    menuItems: [
      { label: 'Home', href: '#home' },
      { label: 'About', href: '#about' },
      { label: 'Services', href: '#services' },
      { label: 'Contact', href: '#contact' },
    ],
    socialLinks: defaultSocialLinks,
  },
};
