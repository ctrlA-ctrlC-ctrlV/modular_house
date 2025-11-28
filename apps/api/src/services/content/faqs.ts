import { PrismaClient } from '@prisma/client';
import { logger } from '../../middleware/logger.js';

const prisma = new PrismaClient();

export interface CreateFAQInput {
  question: string;
  answer: string;
  displayOrder?: number;
}

export interface UpdateFAQInput {
  question?: string;
  answer?: string;
  displayOrder?: number;
}

export class FaqsService {
  /**
   * List all FAQs
   */
  static async findAll() {
    try {
      return await prisma.fAQ.findMany({
        orderBy: { displayOrder: 'asc' },
      });
    } catch (error) {
      logger.error({ error }, 'Error listing FAQs');
      throw error;
    }
  }

  /**
   * Find FAQ by ID
   */
  static async findById(id: string) {
    try {
      return await prisma.fAQ.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error finding FAQ by ID');
      throw error;
    }
  }

  /**
   * Create a new FAQ
   */
  static async create(data: CreateFAQInput) {
    try {
      return await prisma.fAQ.create({
        data: {
          question: data.question,
          answer: data.answer,
          displayOrder: data.displayOrder ?? 0,
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Error creating FAQ');
      throw error;
    }
  }

  /**
   * Update an FAQ
   */
  static async update(id: string, data: UpdateFAQInput) {
    try {
      const existing = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`FAQ with ID "${id}" not found`);
      }

      return await prisma.fAQ.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error({ error, id, data }, 'Error updating FAQ');
      throw error;
    }
  }

  /**
   * Delete an FAQ
   */
  static async delete(id: string) {
    try {
      const existing = await prisma.fAQ.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`FAQ with ID "${id}" not found`);
      }

      return await prisma.fAQ.delete({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Error deleting FAQ');
      throw error;
    }
  }
}
