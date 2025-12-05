import type { Meta, StoryObj } from '@storybook/react';
import { CustomIcons, IconList } from './CustomIcons';

const meta: Meta<typeof CustomIcons> = {
  title: 'Components/Icons',
  component: CustomIcons,
  argTypes: {
    name: {
      control: { type: 'select' },
      options: IconList,
    },
    size: {
      control: { type: 'number' },
    },
    color: {
      control: { type: 'color' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CustomIcons>;

export const Default: Story = {
  args: {
    name: 'spacer',
    size: 48,
  },
};

export const AllIcons: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {IconList.map((iconName) => (
        <div key={iconName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CustomIcons {...args} name={iconName} />
          <span style={{ marginTop: '8px', fontSize: '12px' }}>{iconName}</span>
        </div>
      ))}
    </div>
  ),
  args: {
    size: 48,
  },
};
