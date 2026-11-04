"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileCheck2, Gavel, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { SubmitBidDialog } from "@/features/bids/components/submit-bid-dialog";
import { useVendorBids } from "@/features/bids/bids.hooks";
import { formatCurrency } from "@/lib/format";
import { RequestPhotoGallery } from "./components/request-photo-gallery";
import { useAssignedRequest } from "./work-requests.hooks";

export function VendorRequestDetails({ id }: { id: string }) {
  const detail = useAssignedRequest(id);
  const vendorBids = useVendorBids();
  const [submitOpen, setSubmitOpen] = useState(false);
  if (detail.isPending) return <div className="space-y-5"><div className="h-24 animate-pulse rounded-xl bg-slate-200" /><div className="h-64 animate-pulse rounded-xl bg-slate-200" /></div>;
  if (detail.isError) { const notFound = detail.error instanceof ApiError && detail.error.status === 404; return <Card className="border-slate-200 shadow-none"><CardContent className="flex min-h-72 flex-col items-center justify-center text-center"><h1 className="text-xl font-semibold text-slate-950">{notFound ? "Assigned request not found" : "Unable to load assigned request"}</h1><p className="mt-2 max-w-md text-sm text-slate-500">{notFound ? "This request is not assigned to your vendor account or no longer exists." : getErrorMessage(detail.error)}</p><Button asChild variant="outline" className="mt-5"><Link href="/vendor/requests"><ArrowLeft />Back to requests</Link></Button></CardContent></Card>; }
  const invitation = detail.data;
  const request = invitation.workRequest;
  const currentBid = vendorBids.data?.find((bid) => bid.workRequest.id === id);
  const pendingOpportunity = invitation.status === "PENDING" && request.status === "OPEN" && !currentBid && !vendorBids.isPending;
  const responded = invitation.status === "RESPONDED" || Boolean(currentBid);

  return <div className="space-y-6"><Button variant="ghost" size="sm" asChild><Link href="/vendor/requests"><ArrowLeft />Back to Assigned Requests</Link></Button><section><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{request.title}</h1><StatusBadge status={request.status} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(request.eventDate)}</span><span className="flex items-center gap-1.5"><MapPin className="size-4" />{request.eventLocation}</span><span>Invitation: <span className="font-medium text-slate-700">{invitation.status}</span></span></div></section>
    <div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${pendingOpportunity ? "border-indigo-200 bg-indigo-50 text-indigo-800" : responded ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-700"}`}><div className="flex items-start gap-3">{responded ? <FileCheck2 className="mt-0.5 size-5 shrink-0" /> : <Gavel className="mt-0.5 size-5 shrink-0" />}<div><p className="font-semibold">{currentBid?.status === "ACCEPTED" ? "Quotation accepted" : currentBid ? "Quotation Submitted" : pendingOpportunity ? "Quotation Pending" : request.status === "BOOKED" ? "This request has already been booked." : request.status === "CANCELLED" ? "This request has been cancelled." : "This request is currently read-only."}</p>{currentBid ? <p className="mt-1 text-sm">{formatCurrency(currentBid.amount)} · {currentBid.status}</p> : pendingOpportunity ? <p className="mt-1 text-sm">You&apos;re invited to submit a final quotation for this event.</p> : null}</div></div>{pendingOpportunity ? <Button onClick={() => setSubmitOpen(true)}><Gavel />Submit Quotation</Button> : null}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]"><div className="space-y-6"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Event Information</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.description}</p></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Required Items</CardTitle><CardDescription>Include every item below in your quotation.</CardDescription></CardHeader><CardContent className="px-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Item</TableHead><TableHead>Description</TableHead><TableHead>Quantity</TableHead><TableHead className="pr-6">Unit</TableHead></TableRow></TableHeader><TableBody>{request.items.map((item) => <TableRow key={item.id}><TableCell className="pl-6 font-medium">{item.name}</TableCell><TableCell className="text-slate-600">{item.description ?? "—"}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="pr-6">{item.unit ?? "—"}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card></div><Card className="h-fit border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Reference Photos</CardTitle><CardDescription>Visual guidance provided by Mero Event.</CardDescription></CardHeader><CardContent><RequestPhotoGallery photos={request.photos} /></CardContent></Card></div>
    {pendingOpportunity ? <SubmitBidDialog request={{ id, title: request.title, eventDate: request.eventDate, eventLocation: request.eventLocation, itemCount: request.items.length }} open={submitOpen} onOpenChange={setSubmitOpen} /> : null}
  </div>;
}
