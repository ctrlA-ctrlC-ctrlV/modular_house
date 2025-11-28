import { apiClient, Page, FAQ, GalleryResponse, GalleryItem } from './apiClient';

export const contentClient = {
  getPage: (slug: string) => apiClient.getPage(slug),
  getFAQs: (product?: string) => apiClient.getFAQs(product),
  getGallery: (options?: { category?: 'garden-room' | 'house-extension'; page?: number; pageSize?: number }) => apiClient.getGallery(options),
};

export type { Page, FAQ, GalleryResponse, GalleryItem };
