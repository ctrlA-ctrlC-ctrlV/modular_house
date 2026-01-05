/**
 * TextWithContactForm Validation Schema
 * =============================================================================
 * 
 * PURPOSE:
 * Defines the Zod validation schema for the contact form. This schema ensures
 * data integrity before submission and provides user-friendly error messages.
 * 
 * VALIDATION RULES:
 * - firstName: Required, minimum 1 character
 * - email: Required, valid email format
 * - phone: Required, minimum 1 character
 * - gdprConsent: Required, must be true (checked)
 * - website: Optional, honeypot field for spam prevention
 * 
 * DEPENDENCIES:
 * - zod for schema definition and validation
 * 
 * =============================================================================
 */

import { z } from 'zod';


/* =============================================================================
   FORM VALIDATION SCHEMA
   -----------------------------------------------------------------------------
   Zod schema defining all form fields with validation rules and error messages.
   ============================================================================= */

/**
 * Contact form validation schema.
 * Defines field types, validation rules, and error messages.
 */
export const textContactFormSchema = z.object({
  /** 
   * First name field.
   * Required with minimum length validation.
   */
  firstName: z.string().min(1, { message: "First name is required" }),
  
  /** 
   * Surname field.
   * Optional, no validation constraints.
   */
  surname: z.string().optional(),
  
  /** 
   * Email address field.
   * Required with email format validation.
   */
  email: z.string().email({ message: "Invalid email address" }),
  
  /** 
   * Phone number field.
   * Required with minimum length validation.
   */
  phone: z.string().min(1, { message: "Phone number is required" }),
  
  /** 
   * Street address field.
   * Optional for additional contact context.
   */
  address: z.string().optional(),
  
  /** 
   * Eircode (Irish postal code) field.
   * Optional for location-specific services.
   */
  eircode: z.string().optional(),
  
  /** 
   * Preferred product selection.
   * Optional enum field with predefined options.
   */
  preferredProduct: z.enum(['Garden Room', 'House Extension']).optional(),
  
  /** 
   * Message body field.
   * Optional free-text area for user inquiries.
   */
  message: z.string().optional(),
  
  /** 
   * GDPR consent checkbox.
   * Required and must be true for form submission.
   */
  gdprConsent: z.boolean().refine((val: boolean) => val === true, {
    message: "You must agree to the data collection policy",
  }),
  
  /** 
   * Honeypot field for spam prevention.
   * Should always be empty - bots will fill this automatically.
   * If filled, the form submission should be silently rejected.
   */
  website: z.string().optional(),
});


/* =============================================================================
   TYPE EXPORTS
   -----------------------------------------------------------------------------
   TypeScript type inference from the Zod schema.
   ============================================================================= */

/**
 * Inferred TypeScript type from the form schema.
 * Use this type for form data handling in components and handlers.
 */
export type TextContactFormData = z.infer<typeof textContactFormSchema>;
