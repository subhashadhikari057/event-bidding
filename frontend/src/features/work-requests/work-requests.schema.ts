import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max, `Must be ${max} characters or fewer`);

export const workRequestSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  eventDate: z.string().min(1, "Event date and time are required").refine((value) => !Number.isNaN(new Date(`${value}:00+05:45`).getTime()), "Enter a valid date and time"),
  eventLocation: z.string().trim().min(1, "Event location is required").max(250),
  items: z.array(z.object({
    name: z.string().trim().min(1, "Item name is required").max(150),
    description: optionalText(1000),
    quantity: z.number({ message: "Enter a quantity" }).int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
    unit: optionalText(50),
  })).min(1, "Add at least one required item"),
});

export type WorkRequestFormValues = z.infer<typeof workRequestSchema>;

export function toNepalIso(localValue: string): string {
  return new Date(`${localValue}:00+05:45`).toISOString();
}

export function toNepalDateTimeInput(isoValue: string): string {
  const nepalOffsetMs = 345 * 60 * 1000;
  return new Date(new Date(isoValue).getTime() + nepalOffsetMs).toISOString().slice(0, 16);
}

export function optionalField(value: string): string | undefined {
  return value.trim() || undefined;
}
