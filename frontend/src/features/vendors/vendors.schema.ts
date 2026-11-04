import { z } from "zod";

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const vendorProfileSchema = z.object({
  companyName: requiredText("Company name", 120),
  contactPerson: requiredText("Contact person", 120),
  email: z.string().trim().min(1, "Email address is required").email("Enter a valid email address").max(254),
  phone: requiredText("Phone number", 30),
  address: optionalText(250),
  category: optionalText(100),
});

export const createVendorSchema = vendorProfileSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Password must be 72 characters or fewer"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).superRefine((value, context) => {
  const bytes = new TextEncoder().encode(value.password).length;
  if (bytes < 6 || bytes > 72) {
    context.addIssue({ code: "custom", path: ["password"], message: "Password must contain between 6 and 72 UTF-8 bytes" });
  }
  if (value.password !== value.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
  }
});

export type VendorProfileValues = z.infer<typeof vendorProfileSchema>;
export type CreateVendorValues = z.infer<typeof createVendorSchema>;

export const vendorCategories = [
  "Decoration",
  "Photography",
  "Catering",
  "Sound & Lighting",
  "Equipment Rental",
  "Other",
] as const;

export function optionalValue(value: string): string | undefined {
  const normalized = value.trim();
  return normalized || undefined;
}
