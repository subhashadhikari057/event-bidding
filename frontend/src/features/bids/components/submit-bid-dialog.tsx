"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CalendarDays, LoaderCircle, MapPin, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useSubmitBid } from "../bids.hooks";
import { bidSchema, normalizeAmount, type BidFormValues } from "../bids.schema";

interface RequestSummary {
  id: string;
  title: string;
  eventDate: string;
  eventLocation: string;
  itemCount: number;
}

export function SubmitBidDialog({ request, open, onOpenChange }: { request: RequestSummary; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [confirmation, setConfirmation] = useState<BidFormValues | null>(null);
  const submitBid = useSubmitBid();
  const form = useForm<BidFormValues>({ resolver: zodResolver(bidSchema), defaultValues: { amount: "", notes: "" } });

  const close = () => {
    if (submitBid.isPending) return;
    form.reset();
    setConfirmation(null);
    onOpenChange(false);
  };

  const prepareConfirmation = form.handleSubmit((values) => setConfirmation(values));
  const confirm = async () => {
    if (!confirmation) return;
    try {
      await submitBid.mutateAsync({ workRequestId: request.id, amount: normalizeAmount(confirmation.amount), notes: confirmation.notes.trim() || undefined });
      toast.success("Quotation submitted", { description: "Your final quotation is now available to Mero Event." });
      close();
    } catch (error) { toast.error("Could not submit quotation", { description: getErrorMessage(error) }); }
  };

  return <Dialog open={open} onOpenChange={(next) => !next && close()}><DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Submit Quotation</DialogTitle><DialogDescription>Provide your quotation for this event requirement.</DialogDescription></DialogHeader>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-950">{request.title}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(request.eventDate)}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" />{request.eventLocation}</span><span>{request.itemCount} required item{request.itemCount === 1 ? "" : "s"}</span></div></div>
    {!confirmation ? <form id="submit-bid-form" onSubmit={prepareConfirmation} className="space-y-5" noValidate><div className="space-y-2"><Label htmlFor="bid-amount">Quotation Amount (NPR) <span className="text-red-600">*</span></Label><div className="relative"><span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500">NPR</span><Input id="bid-amount" inputMode="decimal" placeholder="75000.00" className="pl-14" autoFocus aria-invalid={Boolean(form.formState.errors.amount)} {...form.register("amount")} /></div>{form.formState.errors.amount ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.amount.message}</p> : <p className="text-xs text-slate-500">Enter a positive amount with up to two decimal places.</p>}</div><div className="space-y-2"><Label htmlFor="bid-notes">Quotation Notes</Label><Textarea id="bid-notes" rows={6} placeholder="Describe included services, materials, installation or conditions…" aria-invalid={Boolean(form.formState.errors.notes)} {...form.register("notes")} /><div className="flex justify-between gap-4"><p className="text-xs text-red-600" role="alert">{form.formState.errors.notes?.message}</p><p className="ml-auto text-xs text-slate-400">Maximum 2,000 characters</p></div></div></form> : <div className="space-y-4"><div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Confirm final quotation</p><p className="mt-1 text-sm leading-6">Are you sure you want to submit this quotation? Quotations cannot be edited after submission.</p></div></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quotation amount</p><p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(normalizeAmount(confirmation.amount))}</p>{confirmation.notes ? <><p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Notes</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{confirmation.notes}</p></> : null}</div></div>}
    <DialogFooter>{confirmation ? <><Button variant="outline" disabled={submitBid.isPending} onClick={() => setConfirmation(null)}>Back</Button><Button disabled={submitBid.isPending} onClick={() => void confirm()}>{submitBid.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}{submitBid.isPending ? "Submitting…" : "Confirm & Submit"}</Button></> : <><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" form="submit-bid-form">Review Quotation</Button></>}</DialogFooter>
  </DialogContent></Dialog>;
}
