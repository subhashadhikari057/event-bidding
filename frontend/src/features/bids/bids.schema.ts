import { z } from "zod";

const moneyPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

export const bidSchema = z.object({
  amount: z.string().trim().min(1, "Quotation amount is required")
    .regex(moneyPattern, "Enter a valid amount with no more than two decimal places")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero")
    .refine((value) => Number(value) <= 9_999_999_999.99, "Amount cannot exceed NPR 9,999,999,999.99"),
  notes: z.string().trim().max(2000, "Notes must be 2,000 characters or fewer"),
});

export type BidFormValues = z.infer<typeof bidSchema>;

export function normalizeAmount(amount: string): string {
  return Number(amount).toFixed(2);
}
