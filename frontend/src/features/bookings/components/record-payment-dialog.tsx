"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { useRecordPayment } from "../bookings.hooks";
import { createPaymentSchema, type PaymentFormValues } from "../bookings.schema";
import type { PaymentMethod, PaymentSummary } from "../bookings.types";
import { currentLocalDateTime, normalizeMoney } from "../bookings.utils";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "ESEWA", label: "eSewa" },
  { value: "KHALTI", label: "Khalti" },
  { value: "OTHER", label: "Other" },
];

export function RecordPaymentDialog({ bookingId, summary, open, onOpenChange }: { bookingId: string; summary: PaymentSummary; open: boolean; onOpenChange: (open: boolean) => void }) {
  const schema = useMemo(() => createPaymentSchema(summary.pendingAmount), [summary.pendingAmount]);
  const payment = useRecordPayment(bookingId);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", method: "BANK_TRANSFER", reference: "", paidAt: currentLocalDateTime(), notes: "" },
  });

  const close = () => {
    if (payment.isPending) return;
    form.reset({ amount: "", method: "BANK_TRANSFER", reference: "", paidAt: currentLocalDateTime(), notes: "" });
    onOpenChange(false);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      await payment.mutateAsync({
        amount: normalizeMoney(values.amount),
        method: values.method,
        reference: values.reference.trim() || undefined,
        notes: values.notes.trim() || undefined,
        paidAt: values.paidAt ? new Date(values.paidAt).toISOString() : undefined,
      });
      toast.success("Payment recorded", { description: "The payment history and balance have been refreshed." });
      form.reset({ amount: "", method: "BANK_TRANSFER", reference: "", paidAt: currentLocalDateTime(), notes: "" });
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not record payment", { description: getErrorMessage(error) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Record a payment made to the selected vendor. This does not transfer funds.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div><p className="text-xs text-slate-500">Booking</p><p className="mt-1 text-sm font-semibold text-slate-950">{formatCurrency(summary.bookingAmount)}</p></div>
          <div><p className="text-xs text-slate-500">Paid</p><p className="mt-1 text-sm font-semibold text-emerald-700">{formatCurrency(summary.totalPaid)}</p></div>
          <div><p className="text-xs text-slate-500">Remaining</p><p className="mt-1 text-sm font-semibold text-indigo-700">{formatCurrency(summary.pendingAmount)}</p></div>
        </div>
        <form id="record-payment-form" onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2"><Label htmlFor="payment-amount">Payment Amount (NPR) <span className="text-red-600">*</span></Label><div className="relative"><span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500">NPR</span><Input id="payment-amount" inputMode="decimal" placeholder="20000.00" className="pl-14" autoFocus aria-invalid={Boolean(form.formState.errors.amount)} {...form.register("amount")} /></div>{form.formState.errors.amount ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.amount.message}</p> : <p className="text-xs text-slate-500">Maximum available balance: {formatCurrency(summary.pendingAmount)}</p>}</div>
          <div className="space-y-2"><Label htmlFor="payment-method">Payment Method <span className="text-red-600">*</span></Label><Controller control={form.control} name="method" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger id="payment-method" className="w-full" aria-invalid={Boolean(form.formState.errors.method)}><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent>{paymentMethods.map((method) => <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>)}</SelectContent></Select>} />{form.formState.errors.method ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.method.message}</p> : null}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="payment-reference">Transaction Reference</Label><Input id="payment-reference" placeholder="BANK-TXN-001" aria-invalid={Boolean(form.formState.errors.reference)} {...form.register("reference")} />{form.formState.errors.reference ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.reference.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="payment-date">Payment Date</Label><Input id="payment-date" type="datetime-local" aria-invalid={Boolean(form.formState.errors.paidAt)} {...form.register("paidAt")} />{form.formState.errors.paidAt ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.paidAt.message}</p> : null}</div></div>
          <div className="space-y-2"><Label htmlFor="payment-notes">Notes</Label><Textarea id="payment-notes" rows={4} placeholder="Add relevant payment notes…" aria-invalid={Boolean(form.formState.errors.notes)} {...form.register("notes")} /><div className="flex justify-between gap-3"><p className="text-xs text-red-600" role="alert">{form.formState.errors.notes?.message}</p><p className="ml-auto text-xs text-slate-400">Maximum 1,000 characters</p></div></div>
        </form>
        <DialogFooter><Button type="button" variant="outline" disabled={payment.isPending} onClick={close}>Cancel</Button><Button type="submit" form="record-payment-form" disabled={payment.isPending}>{payment.isPending ? <LoaderCircle className="animate-spin" /> : <WalletCards />}{payment.isPending ? "Recording…" : "Record Payment"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
