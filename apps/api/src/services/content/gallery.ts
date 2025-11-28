import { PrismaClient, GalleryCategory, PublishStatus, Prisma } from '@prisma/client';
import { logger } from '../../middleware/logger.js';

const prisma = new PrismaClient();

export interface CreateGalleryItemInput {
  title: string;
  caption?: string;
  category: GalleryCategory;
  imageUrl: string;
  altText: string;
  projectDate?: Date | string;
  publishStatus?: PublishStatus;
}

export interface UpdateGalleryItemInput {
  title?: string;
  caption?: string;
  category?: GalleryCategory;
  imageUrl?: string;
  altText?: string;
  projectDate?: Date | string;
  publishStatus?: PublishStatus;
}

export class GalleryService {
  /**
   * List all gallery items
   */
  static async findAll(filter?: { category?: GalleryCategory; publishStatus?: PublishStatus }) {
    try {
      const where: Prisma.GalleryItemWhereInput = {};
      
      if (filter?.category) {
        where.category = filter.category;
      }
      
      if (filter?.publishStatus) {
        where.publishStatus = filter.publishStatus;
      }

      return await prisma.galleryItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error({ error, filter }, 'Error listing gallery items');
      throw error;
    }
  }

  /**
   * Find gallery item by ID
   */
  static async findById(id: string) {
    try {
      return await prisma.galleryItem.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error finding gallery item by ID');
      throw error;
    }
  }

  /**
   * Create a new gallery item
   */
  static async create(data: CreateGalleryItemInput) {
    try {
      // Validate altText for published items
      if (data.publishStatus === PublishStatus.PUBLISHED && !data.altText) {
        throw new Error('Alt text is required for published items');
      }

      return await prisma.galleryItem.create({
        data: {
          title: data.title,
          caption: data.caption,
          category: data.category,
          imageUrl: data.imageUrl,
          altText: data.altText,
          projectDate: data.projectDate ? new Date(data.projectDate) : null,
          publishStatus: data.publishStatus ?? PublishStatus.DRAFT,
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Error creating gallery item');
      throw error;
    }
  }

  /**
   * Update a gallery item
   */
  static async update(id: string, data: UpdateGalleryItemInput) {
    try {
      // Check if item exists
      const existing = await prisma.galleryItem.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Gallery item with ID "${id}" not found`);
      }

      // Validate altText if publishing or if updating altText while published
      const newStatus = data.publishStatus ?? existing.publishStatus;
      const newAltText = data.altText ?? existing.altText;

      if (newStatus === PublishStatus.PUBLISHED && !newAltText) {
        throw new Error('Alt text is required for published items');
      }

      return await prisma.galleryItem.update({
        where: { id },
        data: {
          title: data.title,
          caption: data.caption,
          category: data.category,
          imageUrl: data.imageUrl,
          altText: data.altText,
          projectDate: data.projectDate ? new Date(data.projectDate) : undefined,
          publishStatus: data.publishStatus,
        },
      });
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating gallery item');
      throw error;
    }
  }

  /**
   * Delete a gallery item
   */
  static async delete(id: string) {
    try {
      // Check if item exists
      const existing = await prisma.galleryItem.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Gallery item with ID "${id}" not found`);
      }

      return await prisma.galleryItem.delete({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error deleting gallery item');
      throw error;
    }
  }
}
