import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../components/Header'
import { GalleryGrid } from '../../components/GalleryGrid'
import { GalleryItem } from '../../lib/contentClient'

// Mock the content client types since we don't need real data for class checks
const mockItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Test Item',
    category: 'garden-room',
    imageUrl: '/test.jpg',
    altText: 'Test Alt',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishStatus: 'PUBLISHED'
  }
]

describe('Template Class Application', () => {
  describe('Header', () => {
    it('uses template header class (c-header)', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      )
      const header = screen.getByRole('banner')
      expect(header.className).toContain('c-header')
    })

    it('uses template navigation class (c-nav)', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      )
      const nav = screen.getByRole('navigation')
      expect(nav.className).toContain('c-nav')
    })
  })

  describe('GalleryGrid', () => {
    it('uses template gallery class (c-gallery)', () => {
      render(
        <GalleryGrid 
          items={mockItems} 
          onOpenLightbox={vi.fn()} 
          registerRef={vi.fn()} 
        />
      )
      // We might need to find the container by a different method if role is not obvious, 
      // but usually a grid is a list or just a div. 
      // Let's assume the root div of the grid should have the class.
      // Since GalleryGrid returns a div with grid classes, we can try to find it by text or just get the first div?
      // Better: check if the container of the items has the class.
      // The current implementation has "No items found" if empty, or a grid div.
      
      // We can look for the container that holds the items.
      // Let's assume we'll add `c-gallery` to the main wrapper.
      // We can query by text "Test Item" and go up to the container, or add a test-id if needed.
      // But for now, let's try to find the container.
      
      // Actually, let's just check if *any* element has c-gallery for now, or be more specific.
      // The current GalleryGrid renders a div with `grid grid-cols-1...`.
      // We expect this to change to `c-gallery` or similar.
      
      const { container } = render(
        <GalleryGrid 
          items={mockItems} 
          onOpenLightbox={vi.fn()} 
          registerRef={vi.fn()} 
        />
      )
      
      // Check if the container div (the grid) has the class
      // The first div inside the component
      const grid = container.firstChild
      expect(grid).toHaveClass('c-gallery')
    })

    it('uses template gallery item class (c-gallery__item)', () => {
      render(
        <GalleryGrid 
          items={mockItems} 
          onOpenLightbox={vi.fn()} 
          registerRef={vi.fn()} 
        />
      )
      
      const item = screen.getByRole('button', { name: /view test item/i })
      expect(item.className).toContain('c-gallery__item')
    })
  })
})
