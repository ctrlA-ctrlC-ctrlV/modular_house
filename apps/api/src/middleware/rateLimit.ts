import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from './logger.js';

// Rate limiter specifically for submission endpoints
// 10 requests per hour per IP as per requirements
export const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Maximum 10 requests per windowMs
  message: {
    error: 'Too many submission requests',
    message: 'You have exceeded the maximum number of submissions allowed per hour. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom key generator to use IP address
  keyGenerator: (req: Request): string => {
    // Use X-Forwarded-For if behind a proxy, otherwise use remoteAddress
    const forwardedFor = req.headers['x-forwarded-for'];
    let clientIP: string;
    
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      clientIP = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    } else {
      clientIP = req.socket?.remoteAddress || 'unknown';
    }
    
    return `submissions:${clientIP}`;
  },
  
  // Custom handler for when rate limit is exceeded
  handler: (req: Request, res: Response) => {
    const clientIP = req.socket?.remoteAddress || 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'];
    
    // Log when rate limit is reached (this replaces onLimitReached)
    logger.warn({
      ip: clientIP,
      forwardedFor,
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      rateLimitType: 'submission',
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    }, 'Submission rate limit exceeded - blocking request');
    
    res.status(429).json({
      error: 'Too many submission requests',
      message: 'You have exceeded the maximum number of submissions allowed per hour. Please try again later.',
      retryAfter: '1 hour'
    });
  },
  
  // Skip successful requests in the count (only count failed attempts)
  skipSuccessfulRequests: false,
  
  // Skip failed requests in the count
  skipFailedRequests: false,
  
  // Skip requests that don't have a valid IP
  skip: (req: Request): boolean => {
    const clientIP = req.socket?.remoteAddress;
    const forwardedFor = req.headers['x-forwarded-for'];
    
    // Skip if no IP can be determined
    if (!clientIP && !forwardedFor) {
      logger.warn({
        url: req.url,
        method: req.method,
        headers: req.headers,
      }, 'Skipping rate limit - no client IP available');
      return true;
    }
    
    return false;
  }
});

// General rate limiter for other endpoints (more lenient)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req: Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    let clientIP: string;
    
    if (forwardedFor) {
      clientIP = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    } else {
      clientIP = req.socket?.remoteAddress || 'unknown';
    }
    
    return `general:${clientIP}`;
  },
  
  handler: (req: Request, res: Response) => {
    const clientIP = req.socket?.remoteAddress || 'unknown';
    
    logger.warn({
      ip: clientIP,
      forwardedFor: req.headers['x-forwarded-for'],
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      rateLimitType: 'general',
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    }, 'General rate limit exceeded - blocking request');
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});