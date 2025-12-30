import nodemailer from 'nodemailer';
import type { Transporter, SendMailOptions } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../middleware/logger.js';

/** Maximum retry attempts for transient email failures */
const MAX_RETRY_ATTEMPTS = 3;

/** Base delay for exponential backoff (milliseconds) */
const RETRY_BASE_DELAY_MS = 2000;

/** SMTP connection timeout (milliseconds) */
const CONNECTION_TIMEOUT_MS = 10000;

/** SMTP greeting timeout (milliseconds) */
const GREETING_TIMEOUT_MS = 10000;

/** Socket inactivity timeout (milliseconds) */
const SOCKET_TIMEOUT_MS = 30000;

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
  private isReady: boolean = false;
  private verificationPromise: Promise<void>;

  constructor() {
    const hasAuth = !!(config.mail.user && config.mail.pass);
    
    if (!hasAuth) {
      logger.warn(
        'SMTP authentication not configured (MAIL_USER or MAIL_PASS missing). ' +
        'Email sending may fail if the SMTP server requires authentication.'
      );
    }

    if (!config.mail.rejectUnauthorized) {
      logger.warn(
        'MAIL_REJECT_UNAUTHORIZED is set to false. ' +
        'TLS certificate validation is disabled. This should only be used temporarily.'
      );
    }

    this.transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.secure,
      auth: hasAuth ? {
        user: config.mail.user,
        pass: config.mail.pass,
      } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      greetingTimeout: GREETING_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
      tls: {
        rejectUnauthorized: config.mail.rejectUnauthorized,
      },
    });

    // Store verification promise for readiness checks
    this.verificationPromise = this.verifyConnection();
    
    // Non-blocking - allow server to start
    this.verificationPromise.catch(() => {
      // Error already logged in verifyConnection
    });
  }

  /**
   * Verify SMTP connection. Returns true if successful.
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.isReady = true;
      logger.info({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure,
        hasAuth: !!(config.mail.user && config.mail.pass),
      }, 'SMTP connection verified successfully');
    } catch (error) {
      this.isReady = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({
        error: errorMessage,
        host: config.mail.host,
        port: config.mail.port,
      }, 'SMTP connection verification failed - email sending will not work');
      throw error;
    }
  }

  /**
   * Wait for SMTP connection to be ready (or fail)
   */
  async ensureReady(): Promise<boolean> {
    try {
      await this.verificationPromise;
      return this.isReady;
    } catch {
      return false;
    }
  }

  /**
   * Check if transporter is ready to send emails
   */
  get ready(): boolean {
    return this.isReady;
  }

  private shouldRetry(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const nodeMailError = error as { 
      responseCode?: number; 
      response?: string;
      code?: string;
    };
    
    // Retry on 5xx server errors
    if (nodeMailError.responseCode && nodeMailError.responseCode >= 500 && nodeMailError.responseCode < 600) {
      return true;
    }

    // Retry on connection/timeout/network errors
    const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'ESOCKET'];
    if (nodeMailError.code && retryableCodes.includes(nodeMailError.code)) {
      return true;
    }

    // Retry on response-based errors
    if (nodeMailError.response) {
      const errorString = nodeMailError.response.toLowerCase();
      return errorString.includes('timeout') || 
             errorString.includes('connection') || 
             errorString.includes('network') ||
             errorString.includes('temporarily');
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 2s, 4s, 8s, etc.
    return RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
  }

  private async sendWithRetry(mailOptions: SendMailOptions, attempt: number = 1): Promise<EmailResult> {
    const startTime = Date.now();
    
    try {
      logger.info({ 
        to: mailOptions.to, 
        subject: mailOptions.subject, 
        attempt,
        maxAttempts: MAX_RETRY_ATTEMPTS,
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
        maxAttempts: MAX_RETRY_ATTEMPTS,
        duration_ms: duration,
      }, 'Email send failed');

      // Retry logic: retry up to MAX_RETRY_ATTEMPTS on transient errors
      if (attempt < MAX_RETRY_ATTEMPTS && this.shouldRetry(error)) {
        const delay = this.getRetryDelay(attempt);
        logger.warn({
          to: mailOptions.to,
          subject: mailOptions.subject,
          error: errorMessage,
          nextAttempt: attempt + 1,
          delayMs: delay,
        }, 'Retrying email send due to transient error');

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(mailOptions, attempt + 1);
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