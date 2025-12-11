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
    // Title is disabled in controls because complex JSX is hard to edit in Storybook UI
    title: { control: false }, 
    description: { control: 'text' },
    buttonText: { control: 'text' },
  },
} satisfies Meta<typeof HeroWithSideText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    backgroundImage: 'https://rebar.themerex.net/wp-content/uploads/2024/05/image-copyright-66.jpg',
    subtitle: 'The creative edge',
    title: (
      <>
        Enhanced comfort made <br />
        stylish, <span className="text-highlight">secure and durable</span>
      </>
    ),
    description: 'Upgrade your home with stylish, secure doors and energy-efficient windows',
    buttonText: 'Get Started',
  },
};

export const CustomContent: Story = {
  args: {
    backgroundImage: 'https://placehold.co/1920x1080',
    subtitle: 'Modern Living',
    title: (
      <>
        Build your <span className="text-highlight">Dream Home</span><br />
        Today
      </>
    ),
    description: 'Experience the future of modular housing with our innovative designs.',
    buttonText: 'View Models',
  },
};