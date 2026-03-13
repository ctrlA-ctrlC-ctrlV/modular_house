import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { validateBody } from '../middleware/validate.js';
import { submissionRateLimit } from '../middleware/rateLimit.js';
import { enquirySubmissionSchema } from '../types/submission.js';
import { logger } from '../middleware/logger.js';
import { SubmissionsService } from '../services/submissions.js';
import { config } from '../config/env.js';

const router: Router = Router();

/**
 * POST /submissions/enquiry
 * 
 * Creates a new enquiry submission with validation, rate limiting, and honeypot protection
 */
router.post('/enquiry',
  submissionRateLimit,
  validateBody(enquirySubmissionSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        address,
        eircode,
        preferredProduct,
        message,
        consent,
        website, // honeypot field
        // Configurator-specific fields (optional, only present for configurator submissions)
        sourcePage,
        configuratorProductSlug,
        configuratorExteriorFinish,
        configuratorInteriorFinish,
        configuratorAddons,
        configuratorTotalCents,
        preferredDate,
      } = req.body;

      // Honeypot check - reject if website field is filled (including whitespace-only).
      // Returns a fake success response to avoid revealing the detection mechanism.
      if (website && website.length > 0) {
        logger.warn({
          ip: req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
          honeypotValue: website,
          email: email,
        }, 'Honeypot triggered - rejecting submission');

        res.status(200).json({
          ok: true,
          id: crypto.randomUUID(),
          quoteNumber: `Q${(new Date().getFullYear() % 100)}10000`,
        });
        return;
      }

      // Extract client information for storage
      const clientIP = req.socket?.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      
      // Create salted hash of IP address (never store raw IP)
      const ipHash = crypto
        .createHmac('sha256', config.security.ipSalt)
        .update(clientIP)
        .digest('hex');

      // Determine source page: use the explicitly provided sourcePage field
      // if present (sent by the configurator), otherwise fall back to
      // extracting the slug from the HTTP Referer header.
      const referer = req.headers['referer'] || '';
      const sourcePageSlug = sourcePage || extractSlugFromReferer(referer) || 'contact';

      // Prepare submission data, including configurator-specific fields
      // when they are present. Non-configurator submissions omit these
      // fields, which preserves backward compatibility.
      const submissionData = {
        firstName,
        lastName,
        email,
        phone,
        address,
        eircode,
        preferredProduct,
        message,
        consent,
        sourcePage: sourcePageSlug,
        configuratorProductSlug,
        configuratorExteriorFinish,
        configuratorInteriorFinish,
        configuratorAddons,
        configuratorTotalCents,
        preferredDate,
      };

      // Create submission record using SubmissionsService
      const result = await SubmissionsService.create({
        submissionData,
        sourcePageSlug,
        ipHash,
        userAgent
      });
      
      const submissionId = result.id;

      logger.info({
        submissionId,
        email,
        sourcePageSlug,
        preferredProduct,
        hasMessage: !!message,
        ipHash: ipHash.substring(0, 8) + '...', // Log partial hash for debugging
        userAgent: userAgent.substring(0, 100), // Truncate user agent
      }, 'Submission created and stored successfully');

      // Process submission emails (internal notification + optional customer confirmation)
      // This runs asynchronously - we don't wait for it to complete
      SubmissionsService.processSubmission(result.submission).catch((emailError) => {
        logger.error({
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          stack: emailError instanceof Error ? emailError.stack : undefined,
          submissionId,
        }, 'Error processing submission emails - submission was stored but emails may have failed');
      });

      // Include the generated quoteNumber in the response so the frontend
      // can display it on the configurator confirmation screen.
      res.status(200).json({
        ok: true,
        id: submissionId,
        quoteNumber: result.quoteNumber,
      });

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.socket?.remoteAddress,
      }, 'Error processing enquiry submission');

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your submission. Please try again later.'
      });
    }
  }
);

/**
 * Extract page slug from referer URL
 */
function extractSlugFromReferer(referer: string): string | null {
  if (!referer) return null;
  
  try {
    const url = new URL(referer);
    const pathname = url.pathname;
    
    // Remove leading/trailing slashes and extract slug
    const slug = pathname.replace(/^\/+|\/+$/g, '');
    
    // Return slug or null if empty
    return slug || null;
  } catch {
    return null;
  }
}

export default router;