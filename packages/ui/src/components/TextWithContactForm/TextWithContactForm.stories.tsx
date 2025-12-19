import type { Meta, StoryObj } from '@storybook/react';
import { TextWithContactForm } from './TextWithContactForm';

const meta: Meta<typeof TextWithContactForm> = {
  title: 'Components/TextWithContactForm',
  component: TextWithContactForm,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof TextWithContactForm>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isSubmitting: true,
  },
};

export const Success: Story = {
  args: {
    submissionSuccess: true,
  },
};

export const ErrorState: Story = {
  args: {
    submissionError: "Something went wrong. Please try again later.",
  },
};

export const CustomContent: Story = {
  args: {
    topLabel: "GET IN TOUCH",
    heading: "We'd love to hear from you",
    description: "Our team is ready to answer all your questions.",
    contactInfo: {
      address: "123 Innovation Dr, Tech City, TC 90210",
      phone: "+1 (555) 123-4567",
      email: "support@techcity.com"
    }
  },
};
