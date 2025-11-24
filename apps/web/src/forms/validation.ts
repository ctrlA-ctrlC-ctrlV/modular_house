import { z } from 'zod';

// Product options for dropdown selection
export const PRODUCT_OPTIONS = ['Garden Room', 'House Extension'] as const;

// Frontend enquiry form schema - matches API but includes honeypot
export const enquiryFormSchema = z.object({
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
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters'),
    
  eircode: z.string()
    .min(1, 'Eircode is required')
    .max(10, 'Eircode must be less than 10 characters')
    .regex(/^[A-Z0-9\s]+$/i, 'Please enter a valid Eircode'),
    
  preferredProduct: z.enum(PRODUCT_OPTIONS, {
    errorMap: () => ({ message: 'Please select a valid product option' })
  }).optional(),
    
  message: z.string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional(),
    
  consent: z.boolean().refine(val => val === true, {
    message: 'You must consent to data processing to submit this form'
  }),
  
  // Honeypot field - should be empty, hidden from user
  website: z.string().max(0, 'Invalid submission').optional()
});

export type EnquiryFormData = z.infer<typeof enquiryFormSchema>;

// Form data without honeypot for API submission
export const submissionDataSchema = enquiryFormSchema.omit({ website: true });
export type SubmissionData = z.infer<typeof submissionDataSchema>;
