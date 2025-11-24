import { PrismaClient, Submission, Prisma } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import { SubmissionPayload, EmailLog } from '../types/submission.js';

// Initialize Prisma client
const prisma = new PrismaClient();

// Default consent text - will be configurable later
const DEFAULT_CONSENT_TEXT = 'I consent to the processing of my personal data for the purpose of handling my enquiry and providing information about your products and services.';

export interface CreateSubmissionInput {
  submissionData: SubmissionPayload;
  sourcePageSlug: string;
  ipHash: string;
  userAgent: string;
  consentText?: string;
}

export interface CreateSubmissionResult {
  id: string;
  submission: Submission;
}

export interface UpdateEmailLogInput {
  submissionId: string;
  emailLog: EmailLog;
}

/**
 * Service for managing enquiry submissions
 */
export class SubmissionsService {
  /**
   * Create a new submission record
   */
  static async create(input: CreateSubmissionInput): Promise<CreateSubmissionResult> {
    const { submissionData, sourcePageSlug, ipHash, userAgent, consentText } = input;

    try {
      logger.info({
        email: submissionData.email,
        sourcePageSlug,
        preferredProduct: submissionData.preferredProduct,
        hasMessage: !!submissionData.message,
      }, 'Creating new submission record');

      const submission = await prisma.submission.create({
        data: {
          payload: submissionData as Prisma.JsonObject,
          sourcePageSlug,
          consentFlag: submissionData.consent,
          consentText: consentText || DEFAULT_CONSENT_TEXT,
          ipHash,
          userAgent,
          emailLog: Prisma.JsonNull, // Will be updated when emails are sent
        },
      });

      logger.info({
        submissionId: submission.id,
        email: submissionData.email,
        sourcePageSlug,
        createdAt: submission.createdAt,
      }, 'Submission record created successfully');

      return {
        id: submission.id,
        submission,
      };

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        email: submissionData.email,
        sourcePageSlug,
      }, 'Failed to create submission record');

      throw new Error('Failed to create submission record');
    }
  }

  /**
   * Update email log for a submission
   */
  static async updateEmailLog(input: UpdateEmailLogInput): Promise<void> {
    const { submissionId, emailLog } = input;

    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          emailLog: emailLog as Prisma.JsonObject,
        },
      });

      logger.info({
        submissionId,
        emailLog,
      }, 'Email log updated for submission');

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId,
      }, 'Failed to update email log');

      throw new Error('Failed to update email log');
    }
  }

  /**
   * Get submission by ID
   */
  static async getById(id: string): Promise<Submission | null> {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id },
      });

      return submission;

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId: id,
      }, 'Failed to get submission by ID');

      throw new Error('Failed to get submission');
    }
  }

  /**
   * List submissions with pagination and filtering
   */
  static async list(options: {
    since?: Date;
    limit?: number;
    offset?: number;
    sourcePageSlug?: string;
  } = {}): Promise<{
    submissions: Submission[];
    total: number;
  }> {
    const { since, limit = 50, offset = 0, sourcePageSlug } = options;

    try {
      const where = {
        ...(since && { createdAt: { gte: since } }),
        ...(sourcePageSlug && { sourcePageSlug }),
      };

      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.submission.count({ where }),
      ]);

      return { submissions, total };

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        options,
      }, 'Failed to list submissions');

      throw new Error('Failed to list submissions');
    }
  }

  /**
   * Get submissions for CSV export
   */
  static async getForExport(since?: Date): Promise<Submission[]> {
    try {
      const submissions = await prisma.submission.findMany({
        where: since ? { createdAt: { gte: since } } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      logger.info({
        count: submissions.length,
        since,
      }, 'Retrieved submissions for export');

      return submissions;

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        since,
      }, 'Failed to get submissions for export');

      throw new Error('Failed to get submissions for export');
    }
  }

  /**
   * Close database connection (for cleanup)
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
const handleShutdown = async (): Promise<void> => {
  logger.info('Shutting down SubmissionsService...');
  await SubmissionsService.disconnect();
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export default SubmissionsService;