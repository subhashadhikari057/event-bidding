"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useWorkRequest } from "@/features/work-requests/work-requests.hooks";
import { AcceptBidDialog } from "./components/accept-bid-dialog";
import { BidDetailsDialog, type BidDetailView } from "./components/bid-details-dialog";
import { useWorkRequestBids } from "./bids.hooks";
import type { AcceptedBooking, ComparisonBid } from "./bids.types";

export function BidComparisonPage({ id }: { id: string }) {
  const request = useWorkRequest(id);
  const comparison = useWorkRequestBids(id);
  const [detailBid, setDetailBid] = useState<ComparisonBid | null>(null);
  const [acceptBid, setAcceptBid] = useState<ComparisonBid | null>(null);
  const [booking, setBooking] = useState<AcceptedBooking | null>(null);
  const loading = request.isPending || comparison.isPending;
  const error = request.error ?? comparison.error;

  if (loading) return <div className="space-y-5"><Skeleton className="h-28 w-full" /><Skeleton className="h-56 w-full" /></div>;
  if (error || !request.data || !comparison.data) { const notFound = error instanceof ApiError && error.status === 404; return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold">{notFound ? "Work request not found" : "Bid comparison is unavailable"}</h1><p className="mt-2 text-sm text-slate-500">{getErrorMessage(error)}</p><Button asChild variant="outline" className="mt-5"><Link href="/admin/bids">Back to bidding</Link></Button></CardContent></Card>; }
  const workRequest = request.data;
  const data = comparison.data;
  const highest = data.bids.length ? data.bids.reduce((maximum, bid) => Math.max(maximum, Number(bid.amount)), 0) : null;
  const winner = data.bids.find((bid) => bid.status === "ACCEPTED");
  const detail: BidDetailView | null = detailBid ? { heading: detailBid.vendor.companyName, subheading: detailBid.vendor.contactPerson, email: detailBid.vendor.email, phone: detailBid.vendor.phone, eventDate: workRequest.eventDate, eventLocation: workRequest.eventLocation, amount: detailBid.amount, notes: detailBid.notes, submittedAt: detailBid.submittedAt, status: detailBid.status } : null;

  return <div className="space-y-6"><Button variant="ghost" size="sm" asChild><Link href="/admin/bids"><ArrowLeft />Back to Bidding Management</Link></Button><section><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Compare Vendor Quotations</h1><StatusBadge status={workRequest.status} /></div><p className="mt-2 text-sm text-slate-500">Evaluate submitted quotations and select a vendor for this work request.</p><div className="mt-4 rounded-xl border border-slate-200 bg-white p-4"><p className="font-semibold text-slate-950">{workRequest.title}</p><div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500"><span>{formatDate(workRequest.eventDate)}</span><span className="flex items-center gap-1"><MapPin className="size-4" />{workRequest.eventLocation}</span></div></div></section>
    {booking ? <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Booking confirmed</p><p className="mt-1 text-sm">Booking {booking.id} was created for {formatCurrency(booking.amount)}.</p></div></div><Button asChild variant="outline" className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100"><Link href={`/admin/bookings/${booking.id}`}>View Booking Details</Link></Button></div> : winner ? <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><Trophy className="mt-0.5 size-5" /><div><p className="font-semibold">Selected vendor: {winner.vendor.companyName}</p><p className="mt-1 text-sm">The quotation for {formatCurrency(winner.amount)} was accepted and competing bids were closed.</p></div></div> : null}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Bid comparison statistics"><StatCard title="Total Submitted Bids" value={data.totalBids} helper="Vendor quotations received" icon={Trophy} /><StatCard title="Lowest Quotation" value={data.lowestBid ? formatCurrency(data.lowestBid) : "—"} helper="Price comparison only" icon={Trophy} /><StatCard title="Highest Quotation" value={highest === null ? "—" : formatCurrency(highest)} helper="Across returned bids" icon={Trophy} /><StatCard title="Selected Vendor" value={winner?.vendor.companyName ?? "—"} helper={winner ? "Confirmed selection" : "No selection yet"} icon={CheckCircle2} /></section>
    <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Quotation Comparison</CardTitle><CardDescription>Sorted by amount from lowest to highest. Price alone does not determine the best vendor.</CardDescription></CardHeader><CardContent className="p-0">{!data.bids.length ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><Trophy className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">No quotations submitted yet</h2><p className="mt-1 text-sm text-slate-500">Invited vendors&apos; bids will appear here.</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Vendor Company</TableHead><TableHead>Contact Person</TableHead><TableHead>Quotation Amount</TableHead><TableHead>Notes</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{data.bids.map((bid, index) => <TableRow key={bid.id} className={index === 0 ? "bg-indigo-50/40" : undefined}><TableCell className="pl-6"><div className="flex items-center gap-2"><span className="font-medium text-slate-900">{bid.vendor.companyName}</span>{index === 0 ? <Badge className="bg-indigo-100 text-indigo-700">Lowest price</Badge> : null}</div><p className="mt-1 text-xs text-slate-500">{bid.vendor.email}</p></TableCell><TableCell className="text-slate-600">{bid.vendor.contactPerson}</TableCell><TableCell className="whitespace-nowrap font-semibold text-slate-950">{formatCurrency(bid.amount)}</TableCell><TableCell className="max-w-56 truncate text-slate-600">{bid.notes ?? "—"}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(bid.submittedAt)}</TableCell><TableCell><StatusBadge status={bid.status} /></TableCell><TableCell className="pr-6"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setDetailBid(bid)}>View Details</Button>{workRequest.status === "OPEN" && bid.status === "SUBMITTED" ? <Button size="sm" onClick={() => setAcceptBid(bid)}>Select Vendor</Button> : null}</div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
    <BidDetailsDialog bid={detail} open={Boolean(detailBid)} onOpenChange={(open) => !open && setDetailBid(null)} />
    <AcceptBidDialog bid={acceptBid} request={{ id, title: workRequest.title, eventDate: workRequest.eventDate }} open={Boolean(acceptBid)} onOpenChange={(open) => !open && setAcceptBid(null)} onAccepted={setBooking} />
  </div>;
}
