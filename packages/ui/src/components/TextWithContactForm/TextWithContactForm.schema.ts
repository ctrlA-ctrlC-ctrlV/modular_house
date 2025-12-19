import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  message: z.string().optional(),
  gdprConsent: z.boolean().refine((val: boolean) => val === true, {
    message: "You must agree to the data collection policy",
  }),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
