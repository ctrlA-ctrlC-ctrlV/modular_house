import { PrismaClient, Redirect } from '@prisma/client';
import { logger } from '../../middleware/logger.js';

const prisma = new PrismaClient();

export interface CreateRedirectInput {
  sourceSlug: string;
  destinationUrl: string;
  active?: boolean;
}

export interface UpdateRedirectInput {
  sourceSlug?: string;
  destinationUrl?: string;
  active?: boolean;
}

export class RedirectsService {
  /**
   * List all redirects
   */
  static async findAll() {
    try {
      return await prisma.redirect.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error({ error }, 'Error listing redirects');
      throw error;
    }
  }

  /**
   * Find redirect by ID
   */
  static async findById(id: string) {
    try {
      return await prisma.redirect.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error finding redirect by ID');
      throw error;
    }
  }

  /**
   * Create a new redirect
   */
  static async create(data: CreateRedirectInput) {
    this.validateLoop(data.sourceSlug, data.destinationUrl);

    try {
      return await prisma.redirect.create({
        data: {
          sourceSlug: this.normalizeSlug(data.sourceSlug),
          destinationUrl: data.destinationUrl,
          active: data.active ?? true,
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Error creating redirect');
      throw error;
    }
  }

  /**
   * Update a redirect
   */
  static async update(id: string, data: UpdateRedirectInput) {
    // If updating slug or destination, we need to validate loops again
    if (data.sourceSlug || data.destinationUrl) {
      const current = await this.findById(id);
      if (!current) {
        throw new Error('Redirect not found');
      }
      
      const newSlug = data.sourceSlug ?? current.sourceSlug;
      const newDest = data.destinationUrl ?? current.destinationUrl;
      
      this.validateLoop(newSlug, newDest);
    }

    try {
      return await prisma.redirect.update({
        where: { id },
        data: {
          ...data,
          sourceSlug: data.sourceSlug ? this.normalizeSlug(data.sourceSlug) : undefined,
        },
      });
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating redirect');
      throw error;
    }
  }

  /**
   * Delete a redirect
   */
  static async delete(id: string) {
    try {
      await prisma.redirect.delete({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error deleting redirect');
      throw error;
    }
  }

  /**
   * Helper to normalize slug (remove leading slash)
   */
  private static normalizeSlug(slug: string): string {
    return slug.startsWith('/') ? slug.substring(1) : slug;
  }

  /**
   * Helper to validate loops
   */
  private static validateLoop(sourceSlug: string, destinationUrl: string) {
    const normalizedSlug = this.normalizeSlug(sourceSlug);
    
    // Check for direct loop (source == destination)
    // Handle relative paths
    if (destinationUrl === `/${normalizedSlug}` || destinationUrl === normalizedSlug) {
      throw new Error('Redirect loop detected: Destination cannot be the same as source');
    }
  }
}
