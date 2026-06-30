/**
 * T065 — Primitive parity contract tests.
 *
 * Asserts `data-slot`, `data-variant`, `data-size` attributes, keyboard
 * focusability, and ARIA roles for the Phase 1 primitive set.  These
 * tests pin template parity (research R2) and accessibility hooks (H4/H6).
 *
 * The primitives do not exist yet; tests fail until T066+ implement them.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Primitive imports — these modules do not exist yet; tests fail with
// "Failed to resolve import" until each primitive is implemented.
import { Button } from '../ui/button.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '../ui/card.js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu.js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.js';
import { Sidebar } from '../ui/sidebar.js';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
} from '../ui/sheet.js';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp.js';

describe('Primitive parity contract', () => {
  // ── Button ──────────────────────────────────────────────────────────

  describe('Button', () => {
    it('renders with data-slot="button"', () => {
      render(<Button>Click</Button>);
      const el = screen.getByRole('button', { name: 'Click' });
      expect(el).toHaveAttribute('data-slot', 'button');
    });

    it('exposes data-variant and data-size attributes', () => {
      render(<Button variant="outline" size="sm">Test</Button>);
      const el = screen.getByRole('button', { name: 'Test' });
      expect(el).toHaveAttribute('data-variant', 'outline');
      expect(el).toHaveAttribute('data-size', 'sm');
    });

    it('defaults to variant="default" and size="default"', () => {
      render(<Button>Default</Button>);
      const el = screen.getByRole('button', { name: 'Default' });
      expect(el).toHaveAttribute('data-variant', 'default');
      expect(el).toHaveAttribute('data-size', 'default');
    });

    it('is focusable (has tabIndex or is natively focusable)', () => {
      render(<Button>Focus me</Button>);
      const el = screen.getByRole('button', { name: 'Focus me' });
      // Buttons are natively focusable; tabIndex should not be -1.
      expect(el.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('is disabled when disabled prop is set', () => {
      render(<Button disabled>Disabled</Button>);
      const el = screen.getByRole('button', { name: 'Disabled' });
      expect(el).toBeDisabled();
    });
  });

  // ── Input ───────────────────────────────────────────────────────────

  describe('Input', () => {
    it('renders with data-slot="input"', () => {
      render(<Input />);
      const el = screen.getByRole('textbox');
      expect(el).toHaveAttribute('data-slot', 'input');
    });

    it('is focusable (has tabIndex or is natively focusable)', () => {
      render(<Input />);
      const el = screen.getByRole('textbox');
      expect(el.tabIndex).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Label ───────────────────────────────────────────────────────────

  describe('Label', () => {
    it('renders with data-slot="label"', () => {
      render(<Label htmlFor="test-input">Name</Label>);
      const el = screen.getByText('Name');
      expect(el).toHaveAttribute('data-slot', 'label');
    });

    it('associates with an input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Email</Label>
          <Input id="test-input" />
        </>,
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'test-input');
    });
  });

  // ── Card ────────────────────────────────────────────────────────────

  describe('Card', () => {
    it('renders Card with data-slot="card"', () => {
      render(<Card>Content</Card>);
      const el = screen.getByText('Content');
      expect(el).toHaveAttribute('data-slot', 'card');
    });

    it('renders CardHeader with data-slot="card-header"', () => {
      render(<CardHeader>Header</CardHeader>);
      const el = screen.getByText('Header');
      expect(el).toHaveAttribute('data-slot', 'card-header');
    });

    it('renders CardContent with data-slot="card-content"', () => {
      render(<CardContent>Body</CardContent>);
      const el = screen.getByText('Body');
      expect(el).toHaveAttribute('data-slot', 'card-content');
    });

    it('renders CardFooter with data-slot="card-footer"', () => {
      render(<CardFooter>Footer</CardFooter>);
      const el = screen.getByText('Footer');
      expect(el).toHaveAttribute('data-slot', 'card-footer');
    });
  });

  // ── Avatar ──────────────────────────────────────────────────────────

  describe('Avatar', () => {
    it('renders Avatar with data-slot="avatar"', () => {
      render(<Avatar />);
      const el = document.querySelector('[data-slot="avatar"]');
      expect(el).toBeInTheDocument();
    });

    it('renders AvatarFallback with data-slot="avatar-fallback"', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>,
      );
      const el = screen.getByText('AB');
      expect(el).toHaveAttribute('data-slot', 'avatar-fallback');
    });

    it('renders AvatarImage with data-slot="avatar-image"', () => {
      render(
        <Avatar>
          <AvatarImage src="/test.png" alt="Test" />
        </Avatar>,
      );
      const el = document.querySelector('[data-slot="avatar-image"]');
      expect(el).toBeInTheDocument();
    });
  });

  // ── InputOTP ────────────────────────────────────────────────────────

  describe('InputOTP', () => {
    it('renders InputOTP with data-slot="input-otp"', () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>,
      );
      const el = document.querySelector('[data-slot="input-otp"]');
      expect(el).toBeInTheDocument();
    });

    it('renders InputOTPGroup with data-slot="input-otp-group"', () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>,
      );
      const el = document.querySelector('[data-slot="input-otp-group"]');
      expect(el).toBeInTheDocument();
    });

    it('renders InputOTPSlot with data-slot="input-otp-slot"', () => {
      render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>,
      );
      const el = document.querySelector('[data-slot="input-otp-slot"]');
      expect(el).toBeInTheDocument();
    });
  });

  // ── Sidebar ─────────────────────────────────────────────────────────

  describe('Sidebar', () => {
    it('renders with data-slot="sidebar"', () => {
      render(<Sidebar>Sidebar content</Sidebar>);
      const el = screen.getByText('Sidebar content');
      expect(el).toHaveAttribute('data-slot', 'sidebar');
    });
  });

  // ── Sheet ───────────────────────────────────────────────────────────

  describe('Sheet', () => {
    it('renders SheetTrigger with data-slot="sheet-trigger"', () => {
      render(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Drawer</SheetContent>
        </Sheet>,
      );
      const el = screen.getByText('Open');
      expect(el).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  });

  // ── DropdownMenu ────────────────────────────────────────────────────

  describe('DropdownMenu', () => {
    it('renders DropdownMenuTrigger with data-slot="dropdown-menu-trigger"', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      const el = screen.getByText('Menu');
      expect(el).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
    });
  });
});
