import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  attempt: number;
  timestamp: Date;
}

export class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: config.mail.user && config.mail.pass ? {
        user: config.mail.user,
        pass: config.mail.pass,
      } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    // Verify connection configuration on startup (async, non-blocking)
    // In development, SMTP might not be available - log but don't block startup
    this.verifyConnection().catch((err) => {
      logger.warn({ error: err }, 'SMTP connection verification skipped - email sending may fail');
    });
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error) {
      // Log but don't throw - allow server to start without SMTP
      logger.warn({ error }, 'SMTP connection verification failed - email sending will not work');
    }
  }

  private shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const nodeMailError = error as { responseCode?: number; response?: string };
    
    // Retry on 5xx server errors
    if (nodeMailError.responseCode && nodeMailError.responseCode >= 500 && nodeMailError.responseCode < 600) {
      return true;
    }

    // Retry on connection/timeout errors
    if (nodeMailError.response) {
      const errorString = nodeMailError.response.toLowerCase();
      return errorString.includes('timeout') || 
             errorString.includes('connection') || 
             errorString.includes('network');
    }

    return false;
  }

  private async sendWithRetry(mailOptions: SendMailOptions, attempt: number = 1): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      logger.info({ 
        to: mailOptions.to, 
        subject: mailOptions.subject, 
        attempt 
      }, 'Attempting to send email');

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      logger.info({
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject,
        attempt,
        duration_ms: duration,
      }, 'Email sent successfully');

      return {
        success: true,
        messageId: info.messageId,
        attempt,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        error: errorMessage,
        to: mailOptions.to,
        subject: mailOptions.subject,
        attempt,
        duration_ms: duration,
      }, 'Email send failed');

      // Retry logic: only retry once on 5xx errors
      if (attempt === 1 && this.shouldRetry(error)) {
        logger.warn({
          to: mailOptions.to,
          subject: mailOptions.subject,
          error: errorMessage,
        }, 'Retrying email send due to server error');

        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.sendWithRetry(mailOptions, 2);
      }

      return {
        success: false,
        error: errorMessage,
        attempt,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send an email with automatic retry on 5xx errors
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const mailOptions: SendMailOptions = {
      from: options.from || `"${config.mail.fromName}" <${config.mail.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    return this.sendWithRetry(mailOptions);
  }

  /**
   * Send internal notification email (e.g., for form submissions)
   */
  async sendInternalNotification(subject: string, content: string, htmlContent?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: config.mail.internalTo,
      subject: `[Modular House] ${subject}`,
      text: content,
      html: htmlContent,
    });
  }

  /**
   * Send customer confirmation email
   */
  async sendCustomerConfirmation(customerEmail: string, subject: string, content: string, htmlContent?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: customerEmail,
      subject,
      text: content,
      html: htmlContent,
    });
  }

  /**
   * Close the mail transporter connection pool
   */
  async close(): Promise<void> {
    this.transporter.close();
    logger.info('Mail transporter connection pool closed');
  }
}

// Export singleton instance
export const mailer = new MailerService();