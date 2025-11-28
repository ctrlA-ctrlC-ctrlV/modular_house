import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../../middleware/logger.js';

const prisma = new PrismaClient();

export interface CreatePageInput {
  title: string;
  slug: string;
  heroHeadline?: string;
  heroSubhead?: string;
  heroImageId?: string;
  sections?: Prisma.InputJsonValue;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  heroHeadline?: string;
  heroSubhead?: string;
  heroImageId?: string;
  sections?: Prisma.InputJsonValue;
  seoTitle?: string;
  seoDescription?: string;
}

export class PagesService {
  /**
   * List all pages
   */
  static async findAll() {
    try {
      return await prisma.page.findMany({
        orderBy: { title: 'asc' },
        include: {
          heroImage: true,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Error listing pages');
      throw error;
    }
  }

  /**
   * Find page by ID
   */
  static async findById(id: string) {
    try {
      return await prisma.page.findUnique({
        where: { id },
        include: {
          heroImage: true,
        },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error finding page by ID');
      throw error;
    }
  }

  /**
   * Find page by slug
   */
  static async findBySlug(slug: string) {
    try {
      return await prisma.page.findUnique({
        where: { slug },
        include: {
          heroImage: true,
        },
      });
    } catch (error) {
      logger.error({ error, slug }, 'Error finding page by slug');
      throw error;
    }
  }

  /**
   * Create a new page
   */
  static async create(data: CreatePageInput) {
    try {
      // Check for duplicate slug
      const existing = await prisma.page.findUnique({
        where: { slug: data.slug },
      });

      if (existing) {
        throw new Error(`Page with slug "${data.slug}" already exists`);
      }

      return await prisma.page.create({
        data: {
          ...data,
          sections: data.sections ?? [],
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Error creating page');
      throw error;
    }
  }

  /**
   * Update a page
   */
  static async update(id: string, data: UpdatePageInput) {
    try {
      // Check if page exists
      const existingPage = await prisma.page.findUnique({
        where: { id },
      });

      if (!existingPage) {
        throw new Error(`Page with ID "${id}" not found`);
      }

      // Check for duplicate slug if slug is being updated
      if (data.slug && data.slug !== existingPage.slug) {
        const duplicate = await prisma.page.findUnique({
          where: { slug: data.slug },
        });

        if (duplicate) {
          throw new Error(`Page with slug "${data.slug}" already exists`);
        }
      }

      return await prisma.page.update({
        where: { id },
        data: {
          ...data,
          lastModifiedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating page');
      throw error;
    }
  }

  /**
   * Delete a page
   */
  static async delete(id: string) {
    try {
      return await prisma.page.delete({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error deleting page');
      throw error;
    }
  }
}
