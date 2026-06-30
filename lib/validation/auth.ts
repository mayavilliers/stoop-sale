import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Add a name people will see.").max(60),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Keep it under 72 characters."),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
