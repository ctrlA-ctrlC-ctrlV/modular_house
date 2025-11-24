import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { validateBody } from '../middleware/validate.js';
import { submissionRateLimit } from '../middleware/rateLimit.js';
import { enquirySubmissionSchema } from '../types/submission.js';
import { logger } from '../middleware/logger.js';
import { SubmissionsService } from '../services/submissions.js';

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
        website // honeypot field
      } = req.body;

      // Honeypot check - reject if website field is filled
      if (website && website.trim() !== '') {
        logger.warn({
          ip: req.socket?.remoteAddress,
          userAgent: req.headers['user-agent'],
          honeypotValue: website,
          email: email, // Log email for tracking spam attempts
        }, 'Honeypot triggered - rejecting submission');
        
        // Return success to avoid revealing honeypot to bot
        res.status(200).json({
          ok: true,
          id: crypto.randomUUID()
        });
        return;
      }

      // Extract client information for storage
      const clientIP = req.socket?.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      
      // Create salted hash of IP address (never store raw IP)
      const ipHash = crypto
        .createHmac('sha256', process.env.IP_SALT || 'default-salt-change-in-production')
        .update(clientIP)
        .digest('hex');

      // Get source page from referer or default
      const referer = req.headers['referer'] || '';
      const sourcePageSlug = extractSlugFromReferer(referer) || 'contact';

      // Prepare submission data for T026 SubmissionsService
      const submissionData = {
        firstName,
        lastName,
        email,
        phone,
        address,
        eircode,
        preferredProduct,
        message,
        consent
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

      res.status(200).json({
        ok: true,
        id: submissionId
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