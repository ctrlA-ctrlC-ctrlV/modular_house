import type { Meta, StoryObj } from '@storybook/react';
import { HeroWithSideText } from './HeroWithSideText';

const meta = {
  title: 'Components/HeroWithSideText',
  component: HeroWithSideText,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundImage: { control: 'text' },
    subtitle: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    buttonText: { control: 'text' },
    buttonLink: { control: 'text' },
    exploreText: { control: 'text' },
    exploreLink: { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof HeroWithSideText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    backgroundImage: 'https://rebar.themerex.net/wp-content/uploads/2024/05/image-copyright-66.jpg',
    subtitle: 'The creative edge',
    title: 'Enhanced comfort made stylish, secure and durable',
    description: 'Upgrade your home with stylish, secure doors and energy-efficient windows',
    buttonText: 'Get Started',
    buttonLink: '#',
    exploreText: 'Explore',
    exploreLink: '#section-anchor-02',
  },
};

export const CustomContent: Story = {
  args: {
    backgroundImage: 'https://placehold.co/1920x1080',
    subtitle: 'Modern Living',
    title: 'Build Your Dream Home',
    description: 'Experience the future of modular housing with our innovative designs.',
    buttonText: 'View Models',
    exploreText: 'Learn More',
  },
};
