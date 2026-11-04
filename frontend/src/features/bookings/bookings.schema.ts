import { z } from "zod";
import { moneyToPaisa } from "./bookings.utils";

const moneyPattern = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const paymentMethods = ["CASH", "BANK_TRANSFER", "ESEWA", "KHALTI", "OTHER"] as const;

export function createPaymentSchema(pendingAmount: string) {
  const pendingPaisa = moneyToPaisa(pendingAmount);
  return z.object({
    amount: z.string().trim().min(1, "Payment amount is required")
      .regex(moneyPattern, "Enter a valid amount with no more than two decimal places")
      .refine((value) => moneyToPaisa(value) > BigInt(0), "Amount must be greater than zero")
      .refine((value) => moneyToPaisa(value) <= pendingPaisa, "Amount cannot exceed the remaining balance"),
    method: z.enum(paymentMethods, { message: "Select a payment method" }),
    reference: z.string().trim().max(200, "Reference must be 200 characters or fewer"),
    paidAt: z.string().refine((value) => value.length === 0 || !Number.isNaN(new Date(value).getTime()), "Enter a valid payment date"),
    notes: z.string().trim().max(1000, "Notes must be 1,000 characters or fewer"),
  });
}

export type PaymentFormValues = z.infer<ReturnType<typeof createPaymentSchema>>;
