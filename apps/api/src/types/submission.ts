import { z } from 'zod';

// Product options for dropdown selection
export const PRODUCT_OPTIONS = ['Garden Room', 'House Extension'] as const;

// Enquiry submission schema based on OpenAPI SubmissionCreate
export const enquirySubmissionSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  
  lastName: z.string()
    .max(100, 'Last name must be less than 100 characters')
    .optional(),
    
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
    
  phone: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number'),
    
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
    
  eircode: z.string()
    .max(10, 'Eircode must be less than 10 characters')
    .regex(/^[A-Z0-9\s]+$/i, 'Please enter a valid Eircode')
    .optional(),
    
  preferredProduct: z.enum(PRODUCT_OPTIONS, {
    errorMap: () => ({ message: 'Please select a valid product option' })
  }).optional(),
    
  message: z.string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional(),
    
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to data processing to submit this form' })
  }),
  
  // Honeypot field - should be empty (validation happens in route handler)
  website: z.string().optional()
});

export type EnquirySubmission = z.infer<typeof enquirySubmissionSchema>;

// Schema for the stored submission payload (what goes into the database)
export const submissionPayloadSchema = enquirySubmissionSchema.omit({ website: true });

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

/** Schema for individual email result in the log */
export const emailResultSchema = z.object({
  status: z.enum(['success', 'failure', 'not-sent']),
  reason: z.string().optional(),
  sentAt: z.string().datetime().optional(),
  attempts: z.number().int().min(0).default(0),
  messageId: z.string().optional(),
});

export type EmailResultLog = z.infer<typeof emailResultSchema>;

/** Email logging structure for tracking all email outcomes */
export const emailLogSchema = z.object({
  internal: emailResultSchema,
  customer: emailResultSchema.optional(),
  processedAt: z.string().datetime(),
  totalDurationMs: z.number().int().min(0).optional(),
});

export type EmailLog = z.infer<typeof emailLogSchema>;