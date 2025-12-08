import type { Meta, StoryObj } from '@storybook/react';
import { MiniFAQs } from './MiniFAQs';

const meta: Meta<typeof MiniFAQs> = {
  title: 'Components/MiniFAQs',
  component: MiniFAQs,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MiniFAQs>;

export const Default: Story = {
  args: {
    title: 'Flooring',
    faqs: [
      {
        number: '01',
        title: 'It starts with floors',
        description: 'At Rebar, we install and upgrade floor coverings that blend style, function, and durability. Our team delivers tailored solutions for homes and businesses, using top materials and expert care.'
      },
      {
        number: '02',
        title: 'Covering all flooring needs',
        description: 'Rebar’s floor covering services include hardwood, tile, carpet, and more. We guide you from selection to finish, ensuring your new floors are safe, stylish, and built to last.'
      },
      {
        number: '03',
        title: 'Handling all flooring needs',
        description: 'We offer expert advice on floor coverings, from moisture control to heavy use areas. Our team ensures your floors meet every need, blending design, safety, and long-term value.'
      }
    ]
  }
};
