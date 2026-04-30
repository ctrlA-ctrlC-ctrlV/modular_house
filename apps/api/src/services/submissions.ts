import { PrismaClient, Submission, Prisma } from '@prisma/client';
import path from 'path';
import { promises as fs } from 'fs';
import { logger } from '../middleware/logger.js';
import { SubmissionPayload, EmailLog, EmailResultLog } from '../types/submission.js';
import { mailer, EmailResult, EmailAttachment } from './mailer.js';
import { config } from '../config/env.js';
import { CONFIGURATOR_PRODUCT_LOOKUP } from '../data/configurator-products.js';
import { resolveFloorPlanFilename } from '../data/configurator-floor-plans.js';
import {
  buildConfiguratorInternalEmail,
  type ConfiguratorAddonItem,
} from '../templates/configurator-internal.js';
import { buildConfiguratorExternalEmail } from '../templates/configurator-external.js';
import { buildEnquiryConfirmationEmail } from '../templates/enquiry-confirmation.js';
import { buildBespokeInternalEmail } from '../templates/bespoke-internal.js';
import { buildBespokeExternalEmail } from '../templates/bespoke-external.js';

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
  /** The generated quote number assigned to the associated Customer record. */
  quoteNumber: string;
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

        // 2. Create Customer record with base contact details and optional
        //    configurator-specific fields. For non-configurator submissions
        //    the configurator fields remain null.
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
                sourcePage: submissionData.sourcePage,
                configuratorProductSlug: submissionData.configuratorProductSlug,
                configuratorExteriorFinish: submissionData.configuratorExteriorFinish,
                configuratorInteriorFinish: submissionData.configuratorInteriorFinish,
                configuratorAddons: submissionData.configuratorAddons,
                configuratorTotalCents: submissionData.configuratorTotalCents,
                preferredDate: submissionData.preferredDate,
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

        return { id: submission.id, submission, quoteNumber: customer.quoteNumber };
      });

      logger.info({
        submissionId: result.id,
        quoteNumber: result.quoteNumber,
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
   * Resolves a comma-separated addon slug string into an array of display-ready
   * addon items using the product lookup table. Unrecognised slugs are included
   * with a fallback name and zero price so the email still lists them.
   */
  private static resolveAddons(
    addonSlugs: string | undefined,
    productSlug: string | undefined
  ): ConfiguratorAddonItem[] {
    if (!addonSlugs || !addonSlugs.trim()) return [];

    const product = productSlug
      ? CONFIGURATOR_PRODUCT_LOOKUP[productSlug]
      : undefined;

    return addonSlugs
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((slug) => {
        const lookup = product?.addons[slug];
        return {
          name: lookup?.name ?? slug,
          priceCents: lookup?.priceCents ?? 0,
        };
      });
  }

  /**
   * Loads the floor plan SVG asset associated with a configurator
   * submission and converts it into an `EmailAttachment` ready to be
   * shipped with the internal notification email.
   *
   * The asset directory is sourced from `config.app.floorplanAssetsDir`,
   * which makes the attachment pipeline portable across local
   * development and production deployments. Any I/O or resolution
   * failure is logged and swallowed so an asset issue cannot block the
   * notification email itself.
   *
   * @returns The resolved attachment plus its filename, or `null` when
   *          no floor plan could be resolved or read.
   */
  private static async loadFloorPlanAttachment(payload: SubmissionPayload): Promise<{
    attachment: EmailAttachment;
    fileName: string;
  } | null> {
    const fileName = resolveFloorPlanFilename(
      payload.configuratorProductSlug,
      payload.configuratorFloorPlan,
      payload.configuratorLayout,
    );

    if (!fileName) {
      logger.info({
        productSlug: payload.configuratorProductSlug,
        floorPlan: payload.configuratorFloorPlan,
        layout: payload.configuratorLayout,
      }, 'No floor plan asset mapped for configurator selection - skipping attachment');
      return null;
    }

    const absolutePath = path.join(config.app.floorplanAssetsDir, fileName);

    try {
      const content = await fs.readFile(absolutePath);
      return {
        fileName,
        attachment: {
          filename: fileName,
          content,
          contentType: 'image/svg+xml',
        },
      };
    } catch (error) {
      logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error',
        absolutePath,
        fileName,
      }, 'Failed to read floor plan asset - email will be sent without attachment');
      return null;
    }
  }

  /**
   * Send internal notification email for a submission
   */
  static async sendInternalNotification(
    submission: Submission,
    quoteNumber?: string,
  ): Promise<EmailResultLog> {
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

      // Branch: select the appropriate internal notification template based
      // on the submission's origin page. Configurator quotes use the
      // detailed product configuration template, bespoke enquiries use the
      // bespoke template (configurator context + custom request), and all
      // other sources fall through to the existing generic enquiry template.
      const isConfigurator = payload.sourcePage === 'configurator';
      const isBespoke = payload.sourcePage === 'bespoke';

      let subject: string;
      let textContent: string;
      let htmlContent: string;
      // Attachments collected during template selection. Currently only
      // the configurator branch produces attachments (the customer's
      // selected floor plan), but the variable is hoisted here so future
      // branches can extend the behaviour without restructuring the
      // surrounding control flow (Open-Closed Principle).
      let attachments: EmailAttachment[] | undefined;

      if (isBespoke && quoteNumber) {
        // Bespoke enquiry: customer used the configurator but wants a custom
        // solution. Include the configurator context for team reference.
        const productData = payload.configuratorProductSlug
          ? CONFIGURATOR_PRODUCT_LOOKUP[payload.configuratorProductSlug]
          : undefined;

        const addons = this.resolveAddons(
          payload.configuratorAddons,
          payload.configuratorProductSlug,
        );

        const templateResult = buildBespokeInternalEmail({
          quoteNumber,
          submittedAt: submission.createdAt.toISOString(),
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone,
          address: payload.address ?? '',
          productName: productData?.name ?? payload.configuratorProductSlug ?? 'Unknown',
          productDimensions: productData?.dimensions ?? '',
          productArea: productData?.area ?? '',
          exteriorFinish: payload.configuratorExteriorFinish ?? 'Not specified',
          interiorFinish: payload.configuratorInteriorFinish ?? 'Not specified',
          addons,
          totalCents: payload.configuratorTotalCents ?? 0,
          bespokeMessage: payload.message ?? '',
        });

        subject = templateResult.subject;
        textContent = templateResult.text;
        htmlContent = templateResult.html;
      } else if (isConfigurator && quoteNumber) {
        const productData = payload.configuratorProductSlug
          ? CONFIGURATOR_PRODUCT_LOOKUP[payload.configuratorProductSlug]
          : undefined;

        const addons = this.resolveAddons(
          payload.configuratorAddons,
          payload.configuratorProductSlug,
        );

        // Resolve and load the customer's selected floor plan SVG so it
        // can be attached to the internal notification. Failure here
        // does not abort sending - the email is still useful without
        // the attachment.
        const floorPlan = await this.loadFloorPlanAttachment(payload);
        if (floorPlan) {
          attachments = [floorPlan.attachment];
        }

        const templateResult = buildConfiguratorInternalEmail({
          quoteNumber,
          submittedAt: submission.createdAt.toISOString(),
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone,
          eircode: payload.eircode ?? '',
          productName: productData?.name ?? payload.configuratorProductSlug ?? 'Unknown',
          productDimensions: productData?.dimensions ?? '',
          productArea: productData?.area ?? '',
          exteriorFinish: payload.configuratorExteriorFinish ?? 'Not specified',
          interiorFinish: payload.configuratorInteriorFinish ?? 'Not specified',
          addons,
          totalCents: payload.configuratorTotalCents ?? 0,
          preferredDate: payload.preferredDate ?? 'asap',
          message: payload.message ?? '',
          floorPlanFileName: floorPlan?.fileName,
        });

        subject = templateResult.subject;
        textContent = templateResult.text;
        htmlContent = templateResult.html;
      } else {
        subject = `New Enquiry from ${payload.firstName} ${payload.lastName || ''}`.trim();

        textContent = `
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

        htmlContent = `
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
      }

      const result = await mailer.sendInternalNotification(subject, textContent, htmlContent, attachments);

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
  static async sendCustomerConfirmation(
    submission: Submission,
    quoteNumber?: string,
  ): Promise<EmailResultLog | null> {
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

      // Branch: select the appropriate customer confirmation template based
      // on the submission's origin page. Configurator quotes receive the
      // detailed configuration summary, bespoke enquiries receive a simple
      // acknowledgement, and all other sources use the generic enquiry
      // confirmation template.
      const isConfigurator = payload.sourcePage === 'configurator';
      const isBespoke = payload.sourcePage === 'bespoke';

      let subject: string;
      let textContent: string;
      let htmlContent: string;

      if (isBespoke && quoteNumber) {
        // Bespoke enquiry: customer receives a simple acknowledgement
        // without configuration details or pricing echoed back.
        const templateResult = buildBespokeExternalEmail({
          firstName: payload.firstName,
          quoteNumber,
        });

        subject = templateResult.subject;
        textContent = templateResult.text;
        htmlContent = templateResult.html;
      } else if (isConfigurator && quoteNumber) {
        const productData = payload.configuratorProductSlug
          ? CONFIGURATOR_PRODUCT_LOOKUP[payload.configuratorProductSlug]
          : undefined;

        const addons = this.resolveAddons(
          payload.configuratorAddons,
          payload.configuratorProductSlug,
        );

        const templateResult = buildConfiguratorExternalEmail({
          quoteNumber,
          firstName: payload.firstName,
          productName: productData?.name ?? payload.configuratorProductSlug ?? 'Unknown',
          productDimensions: productData?.dimensions ?? '',
          exteriorFinish: payload.configuratorExteriorFinish ?? 'Not specified',
          interiorFinish: payload.configuratorInteriorFinish ?? 'Not specified',
          addons,
          totalCents: payload.configuratorTotalCents ?? 0,
        });

        subject = templateResult.subject;
        textContent = templateResult.text;
        htmlContent = templateResult.html;
      } else {
        // Non-configurator submissions (contact form, landing page,
        // garden room enquiry modal, etc.) use the generic enquiry
        // confirmation template.
        const templateResult = buildEnquiryConfirmationEmail({
          firstName: payload.firstName,
          preferredProduct: payload.preferredProduct,
          quoteNumber: quoteNumber || '',
        });

        subject = templateResult.subject;
        textContent = templateResult.text;
        htmlContent = templateResult.html;
      }

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
   * Process submission: send emails and update email log.
   *
   * @param submission - The Prisma Submission record.
   * @param quoteNumber - The generated quote reference from the Customer record.
   *   Required for configurator submissions so the email templates can display it.
   */
  static async processSubmission(
    submission: Submission,
    quoteNumber?: string,
  ): Promise<void> {
    const startTime = Date.now();

    logger.info({
      submissionId: submission.id,
    }, 'Processing submission emails');

    // Send internal notification (required)
    const internalResult = await this.sendInternalNotification(submission, quoteNumber);

    // Send customer confirmation (optional, based on config)
    const customerResult = await this.sendCustomerConfirmation(submission, quoteNumber);

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