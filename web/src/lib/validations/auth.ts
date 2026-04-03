import { z } from "zod";

export const loginFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(3, "Phone must be at least 3 characters")
    .max(32, "Phone is too long"),
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
    phone: z
      .string()
      .trim()
      .min(3, "Phone must be at least 3 characters")
      .max(32, "Phone is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** Seller / delivery multipart registration (plus proposal file in UI). */
export const partnerRegisterFormSchema = registerFormSchema.extend({
  email: z.string().trim().email("Enter a valid email").max(254, "Email is too long"),
  about: z
    .string()
    .trim()
    .min(20, "Tell us at least a few sentences (20+ characters)")
    .max(8000, "About is too long"),
});

export type PartnerRegisterFormValues = z.infer<typeof partnerRegisterFormSchema>;
