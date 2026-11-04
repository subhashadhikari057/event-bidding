"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BidStatus } from "../bids.types";

export interface BidDetailView {
  heading: string;
  subheading?: string;
  email?: string;
  phone?: string;
  eventDate: string;
  eventLocation: string;
  amount: string;
  notes: string | null;
  submittedAt: string;
  status: BidStatus;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-6 border-b border-slate-100 py-3 last:border-0"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-right text-sm font-medium text-slate-900">{value}</dd></div>;
}

export function BidDetailsDialog({ bid, open, onOpenChange }: { bid: BidDetailView | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!bid) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Quotation Details</DialogTitle><DialogDescription>Read-only quotation submitted to Mero Event.</DialogDescription></DialogHeader><div className="space-y-5"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-950">{bid.heading}</p>{bid.subheading ? <p className="mt-1 text-sm text-slate-500">{bid.subheading}</p> : null}</div><StatusBadge status={bid.status} /></div><div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(bid.eventDate)}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" />{bid.eventLocation}</span></div></div><dl><DetailRow label="Quoted Amount" value={formatCurrency(bid.amount)} /><DetailRow label="Submitted" value={formatDate(bid.submittedAt)} />{bid.email ? <DetailRow label="Email" value={bid.email} /> : null}{bid.phone ? <DetailRow label="Phone" value={bid.phone} /> : null}</dl><div><p className="text-sm font-medium text-slate-900">Quotation Notes</p><p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">{bid.notes ?? "No notes provided."}</p></div></div><DialogFooter><Button onClick={() => onOpenChange(false)}>Done</Button></DialogFooter></DialogContent></Dialog>;
}
