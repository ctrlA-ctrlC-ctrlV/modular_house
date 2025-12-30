import { z } from 'zod';

export const textContactFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  surname: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().optional(),
  eircode: z.string().optional(),
  preferredProduct: z.enum(['Garden Room', 'House Extension']).optional(),
  message: z.string().optional(),
  gdprConsent: z.boolean().refine((val: boolean) => val === true, {
    message: "You must agree to the data collection policy",
  }),
  /** Honeypot field - should always be empty */
  website: z.string().optional(),
});

export type TextContactFormData = z.infer<typeof textContactFormSchema>;
