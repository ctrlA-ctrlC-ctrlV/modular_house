import { z } from 'zod';

// Product options for dropdown selection
export const PRODUCT_OPTIONS = ['Garden Room', 'House Extension'] as const;

/**
 * Valid source pages that can generate enquiry submissions.
 * Used to identify where a submission originated from within the site.
 */
export const SOURCE_PAGE_OPTIONS = ['contact', 'landing', 'garden-room', 'configurator'] as const;

// Enquiry submission schema based on OpenAPI SubmissionCreate.
// Extends the base contact form fields with optional configurator-specific
// data that is only populated when the submission originates from the
// garden room product configurator.
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
  website: z.string().optional(),

  // -- Configurator-specific optional fields --------------------------------
  // These fields are only sent when the submission originates from the
  // garden room product configurator. Standard contact form submissions
  // omit these fields entirely, preserving backward compatibility.

  /** Identifies the originating page (e.g. "configurator", "contact"). */
  sourcePage: z.enum(SOURCE_PAGE_OPTIONS).optional(),

  /** Product slug selected in the configurator (e.g. "studio-25"). */
  configuratorProductSlug: z.string().max(50).optional(),

  /** Name of the selected exterior cladding finish. */
  configuratorExteriorFinish: z.string().max(50).optional(),

  /** Name of the selected interior wall finish. */
  configuratorInteriorFinish: z.string().max(50).optional(),

  /** Comma-separated list of selected add-on slugs. */
  configuratorAddons: z.string().max(500).optional(),

  /** Total configured price in euro cents (base price + selected add-ons). */
  configuratorTotalCents: z.number().int().positive().optional(),

  /** Floor plan variant slug (e.g. "5x5", "4x6"). Only for products with floor plan variants. */
  configuratorFloorPlan: z.string().max(50).optional(),

  /** Layout option slug (e.g. "box", "en-suite", "bedroom"). Only for products with layout options. */
  configuratorLayout: z.string().max(50).optional(),

  /** Customer's preferred consultation date: "asap" or an ISO date string. */
  preferredDate: z.string().max(50).optional(),
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