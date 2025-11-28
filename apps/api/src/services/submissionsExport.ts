import { PrismaClient } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import { SubmissionPayload } from '../types/submission.js';

const prisma = new PrismaClient();

export class SubmissionsExportService {
  /**
   * List all submissions with pagination
   */
  static async findAll(page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const [total, items] = await Promise.all([
        prisma.submission.count(),
        prisma.submission.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      return {
        data: items,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error }, 'Error listing submissions');
      throw error;
    }
  }

  /**
   * Export all submissions to CSV format
   */
  static async exportToCsv(): Promise<string> {
    try {
      const submissions = await prisma.submission.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'ID',
        'Created At',
        'Source Page',
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Address',
        'Eircode',
        'Product',
        'Message',
        'Consent',
        'Consent Text',
        'IP Hash',
        'User Agent'
      ];

      const rows = submissions.map(sub => {
        const payload = sub.payload as unknown as SubmissionPayload;
        
        return [
          sub.id,
          sub.createdAt.toISOString(),
          sub.sourcePageSlug,
          payload.firstName || '',
          payload.lastName || '',
          payload.email || '',
          payload.phone || '',
          payload.address || '',
          payload.eircode || '',
          payload.preferredProduct || '',
          payload.message || '',
          sub.consentFlag ? 'true' : 'false',
          sub.consentText,
          sub.ipHash,
          sub.userAgent || ''
        ].map(field => this.escapeCsvField(field)).join(',');
      });

      return [headers.join(','), ...rows].join('\n');
    } catch (error) {
      logger.error({ error }, 'Error exporting submissions to CSV');
      throw error;
    }
  }

  /**
   * Helper to escape CSV fields
   */
  private static escapeCsvField(field: string | null | undefined): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    const stringField = String(field);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
  }
}
