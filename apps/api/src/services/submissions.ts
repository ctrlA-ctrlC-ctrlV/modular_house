import { PrismaClient, Submission, Prisma } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import { SubmissionPayload, EmailLog, EmailResultLog } from '../types/submission.js';
import { mailer, EmailResult } from './mailer.js';
import { config } from '../config/env.js';

// Initialize Prisma client
const prisma = new PrismaClient();

// Default consent text - will be configurable later
const DEFAULT_CONSENT_TEXT = 'I consent to the processing of my personal data for the purpose of handling my enquiry and providing information about your products and services.';

// Helper to generate quote number
async function generateQuoteNumber(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // 2 digits
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Find latest quote
  const latestCustomer = await tx.customer.findFirst({
    orderBy: { quoteNumber: 'desc' },
    select: { quoteNumber: true }
  });

  let newSequence = 1;

  if (latestCustomer && latestCustomer.quoteNumber) {
    // Expected format: QYYQSSSS (e.g. Q2540001)
    const raw = latestCustomer.quoteNumber.substring(1); // Remove 'Q'
    if (raw.length === 7) {
        const storedYear = parseInt(raw.substring(0, 2));
        const storedQuarter = parseInt(raw.substring(2, 3));
        const storedSequence = parseInt(raw.substring(3, 7));
        
        // Case A: New Time Period
        if (currentYear > storedYear || (currentYear === storedYear && currentQuarter > storedQuarter)) {
            newSequence = 1;
        } 
        // Case B: Same Time Period
        else if (currentYear === storedYear && currentQuarter === storedQuarter) {
            newSequence = storedSequence + 1;
        }
    }
  }

  const sequenceStr = newSequence.toString().padStart(4, '0');
  return `Q${currentYear}${currentQuarter}${sequenceStr}`;
}

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

      const result = await prisma.$transaction(async (tx) => {
        // 1. Generate Quote Number
        const quoteNumber = await generateQuoteNumber(tx);

        // 2. Create Customer
        const customer = await tx.customer.create({
            data: {
                quoteNumber,
                firstName: submissionData.firstName,
                surname: submissionData.lastName,
                email: submissionData.email,
                phone: submissionData.phone,
                address: submissionData.address,
                eircode: submissionData.eircode,
                product: submissionData.preferredProduct || 'Unspecified',
                status: 'active',
                createdBy: 'system',
            }
        });

        // 3. Create Note if message exists
        if (submissionData.message) {
            await tx.note.create({
                data: {
                    customerId: customer.id,
                    message: submissionData.message,
                    createdBy: 'customer',
                }
            });
        }

        // 4. Create Submission (Legacy/Audit)
        const submission = await tx.submission.create({
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

        return { id: submission.id, submission };
      });

      logger.info({
        submissionId: result.id,
        email: submissionData.email,
        sourcePageSlug,
        createdAt: result.submission.createdAt,
      }, 'Submission record created successfully');

      return result;

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
   * Convert mailer result to email result log format
   */
  private static toEmailResultLog(
    result: EmailResult, 
    status: 'success' | 'failure' | 'not-sent' = result.success ? 'success' : 'failure'
  ): EmailResultLog {
    return {
      status,
      reason: result.error,
      sentAt: result.timestamp.toISOString(),
      attempts: result.attempt,
      messageId: result.messageId,
    };
  }

  /**
   * Send internal notification email for a submission
   */
  static async sendInternalNotification(submission: Submission): Promise<EmailResultLog> {
    try {
      // Check if mailer is ready
      const isReady = await mailer.ensureReady();
      if (!isReady) {
        logger.warn({
          submissionId: submission.id,
        }, 'Mailer not ready - SMTP connection may be misconfigured');
        
        return {
          status: 'failure',
          reason: 'SMTP connection not available',
          attempts: 0,
        };
      }

      const payload = submission.payload as SubmissionPayload;
      
      const subject = `New Enquiry from ${payload.firstName} ${payload.lastName || ''}`.trim();
      
      const textContent = `
        New Enquiry Submission

        Name: ${payload.firstName} ${payload.lastName || ''}
        Email: ${payload.email}
        Phone: ${payload.phone}
        Address: ${payload.address}
        Eircode: ${payload.eircode}
        ${payload.preferredProduct ? `Preferred Product: ${payload.preferredProduct}` : ''}
        ${payload.message ? `Message: ${payload.message}` : ''}

        Submitted from: ${submission.sourcePageSlug}
        Submission ID: ${submission.id}
        Timestamp: ${submission.createdAt.toISOString()}
        Consent: ${submission.consentFlag ? 'Yes' : 'No'}
            `.trim();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 15px; border-bottom: 3px solid #2c5282; }
            .content { padding: 20px; background-color: #ffffff; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #2c5282; }
            .value { margin-top: 5px; }
            .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
            <h2 style="margin: 0; color: #2c5282;">New Enquiry Submission</h2>
            </div>
            <div class="content">
            <div class="field">
                <div class="label">Name:</div>
                <div class="value">${payload.firstName} ${payload.lastName || ''}</div>
            </div>
            <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${payload.email}">${payload.email}</a></div>
            </div>
            <div class="field">
                <div class="label">Phone:</div>
                <div class="value"><a href="tel:${payload.phone}">${payload.phone}</a></div>
            </div>
            <div class="field">
                <div class="label">Address:</div>
                <div class="value">${payload.address}</div>
            </div>
            <div class="field">
                <div class="label">Eircode:</div>
                <div class="value">${payload.eircode}</div>
            </div>
            ${payload.preferredProduct ? `
            <div class="field">
                <div class="label">Preferred Product:</div>
                <div class="value">${payload.preferredProduct}</div>
            </div>
            ` : ''}
            ${payload.message ? `
            <div class="field">
                <div class="label">Message:</div>
                <div class="value">${payload.message.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            <div class="footer">
                <p><strong>Submission Details:</strong></p>
                <p>Source Page: ${submission.sourcePageSlug}</p>
                <p>Submission ID: ${submission.id}</p>
                <p>Timestamp: ${submission.createdAt.toISOString()}</p>
                <p>Consent Given: ${submission.consentFlag ? 'Yes' : 'No'}</p>
            </div>
            </div>
        </div>
        </body>
        </html>
            `.trim();

      const result = await mailer.sendInternalNotification(subject, textContent, htmlContent);

      if (result.success) {
        logger.info({
          submissionId: submission.id,
          messageId: result.messageId,
          attempts: result.attempt,
        }, 'Internal notification email sent successfully');
        
        return this.toEmailResultLog(result);
      } else {
        logger.warn({
          submissionId: submission.id,
          error: result.error,
          attempts: result.attempt,
        }, 'Internal notification email failed');
        
        return this.toEmailResultLog(result);
      }

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId: submission.id,
      }, 'Failed to send internal notification email');

      return {
        status: 'failure',
        reason: error instanceof Error ? error.message : 'Unknown error',
        attempts: 0,
      };
    }
  }

  /**
   * Send customer confirmation email (if enabled)
   */
  static async sendCustomerConfirmation(submission: Submission): Promise<EmailResultLog | null> {
    // Check if customer confirmation is enabled
    if (!config.app.customerConfirmEnabled) {
      logger.info({
        submissionId: submission.id,
      }, 'Customer confirmation email disabled by configuration');
      return null;
    }

    try {
      // Check if mailer is ready
      const isReady = await mailer.ensureReady();
      if (!isReady) {
        logger.warn({
          submissionId: submission.id,
        }, 'Mailer not ready for customer confirmation - SMTP connection may be misconfigured');
        
        return {
          status: 'failure',
          reason: 'SMTP connection not available',
          attempts: 0,
        };
      }

      const payload = submission.payload as SubmissionPayload;
      
      const subject = 'Thank you for your enquiry - Modular House';
      
      const textContent = `
        Dear ${payload.firstName},

        Thank you for your enquiry about our modular house solutions.

        We have received your message and one of our team members will be in touch with you shortly to discuss your requirements.

        If you have any urgent questions in the meantime, please feel free to contact us directly.

        Best regards,
        The Modular House Team

        ---
        This is an automated confirmation. Please do not reply to this email.
            `.trim();

            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c5282; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #ffffff; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
            <h1 style="margin: 0;">Modular House</h1>
            </div>
            <div class="content">
            <p>Dear ${payload.firstName},</p>
            
            <p>Thank you for your enquiry about our modular house solutions.</p>
            
            <p>We have received your message and one of our team members will be in touch with you shortly to discuss your requirements.</p>
            
            <p>If you have any urgent questions in the meantime, please feel free to contact us directly.</p>
            
            <p>Best regards,<br>
            <strong>The Modular House Team</strong></p>
            
            <div class="footer">
                <p>This is an automated confirmation. Please do not reply to this email.</p>
            </div>
            </div>
        </div>
        </body>
        </html>
            `.trim();

      const result = await mailer.sendCustomerConfirmation(
        payload.email,
        subject,
        textContent,
        htmlContent
      );

      if (result.success) {
        logger.info({
          submissionId: submission.id,
          customerEmail: payload.email,
          messageId: result.messageId,
          attempts: result.attempt,
        }, 'Customer confirmation email sent successfully');
        
        return this.toEmailResultLog(result);
      } else {
        logger.warn({
          submissionId: submission.id,
          customerEmail: payload.email,
          error: result.error,
          attempts: result.attempt,
        }, 'Customer confirmation email failed');
        
        return this.toEmailResultLog(result);
      }

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        submissionId: submission.id,
      }, 'Failed to send customer confirmation email');

      return {
        status: 'failure',
        reason: error instanceof Error ? error.message : 'Unknown error',
        attempts: 0,
      };
    }
  }

  /**
   * Process submission: send emails and update email log
   */
  static async processSubmission(submission: Submission): Promise<void> {
    const startTime = Date.now();
    
    logger.info({
      submissionId: submission.id,
    }, 'Processing submission emails');

    // Send internal notification (required)
    const internalResult = await this.sendInternalNotification(submission);

    // Send customer confirmation (optional, based on config)
    const customerResult = await this.sendCustomerConfirmation(submission);

    const duration = Date.now() - startTime;

    // Build email log with proper structure
    const emailLog: EmailLog = {
      internal: internalResult,
      processedAt: new Date().toISOString(),
      totalDurationMs: duration,
    };

    // Add customer email result if enabled and sent
    if (customerResult) {
      emailLog.customer = customerResult;
    }

    // Update submission with email log
    try {
      await this.updateEmailLog({
        submissionId: submission.id,
        emailLog,
      });
    } catch (updateError) {
      // Log the error but don't throw - we want to ensure email outcomes are recorded even if DB update fails
      logger.error({
        error: updateError instanceof Error ? updateError.message : 'Unknown error',
        stack: updateError instanceof Error ? updateError.stack : undefined,
        submissionId: submission.id,
        emailLog,
      }, 'Failed to persist email log to database, but email processing completed');
    }

    logger.info({
      submissionId: submission.id,
      internalStatus: internalResult.status,
      internalAttempts: internalResult.attempts,
      customerStatus: customerResult?.status || 'not-sent',
      customerAttempts: customerResult?.attempts || 0,
      duration_ms: duration,
    }, 'Submission email processing completed');
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