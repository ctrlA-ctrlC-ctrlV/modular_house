import { z } from 'zod';

export const contactFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  surname: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  eircode: z.string().min(1, { message: "Eircode is required" }),
  message: z.string().optional(),
  gdprConsent: z.boolean().refine((val: boolean) => val === true, {
    message: "You must agree to the data collection policy",
  }),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
