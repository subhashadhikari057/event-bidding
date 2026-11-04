"use client";

import { AlertTriangle, LoaderCircle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAcceptBid } from "../bids.hooks";
import type { AcceptedBooking, ComparisonBid } from "../bids.types";

export function AcceptBidDialog({ bid, request, open, onOpenChange, onAccepted }: { bid: ComparisonBid | null; request: { id: string; title: string; eventDate: string }; open: boolean; onOpenChange: (open: boolean) => void; onAccepted: (booking: AcceptedBooking) => void }) {
  const accept = useAcceptBid();
  if (!bid) return null;
  const confirm = async () => {
    try { const booking = await accept.mutateAsync({ bidId: bid.id, workRequestId: request.id }); toast.success("Vendor selected", { description: "A confirmed booking has been created." }); onAccepted(booking); onOpenChange(false); }
    catch (error) { toast.error("Could not select vendor", { description: getErrorMessage(error) }); }
  };
  return <AlertDialog open={open} onOpenChange={(next) => !accept.isPending && onOpenChange(next)}><AlertDialogContent><AlertDialogHeader><div className="mb-2 flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><Trophy className="size-5" /></div><AlertDialogTitle>Confirm Vendor Selection</AlertDialogTitle><AlertDialogDescription>You&apos;re about to accept this vendor&apos;s quotation and create a confirmed booking.</AlertDialogDescription></AlertDialogHeader><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-semibold text-slate-950">{request.title}</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Selected vendor</dt><dd className="font-medium text-slate-900">{bid.vendor.companyName}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Quotation</dt><dd className="font-medium text-slate-900">{formatCurrency(bid.amount)}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Event date</dt><dd className="font-medium text-slate-900">{formatDate(request.eventDate)}</dd></div></dl></div><div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />Once confirmed, other submitted quotations will be rejected. This action cannot be reversed in the current system.</div><AlertDialogFooter><AlertDialogCancel disabled={accept.isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={accept.isPending} onClick={(event) => { event.preventDefault(); void confirm(); }}>{accept.isPending ? <LoaderCircle className="animate-spin" /> : <Trophy />}{accept.isPending ? "Confirming…" : "Confirm Selection"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
