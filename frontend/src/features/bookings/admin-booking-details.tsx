"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CalendarDays, FileCheck2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { FinancialSummary } from "./components/financial-summary";
import { PaymentHistory } from "./components/payment-history";
import { RecordPaymentDialog } from "./components/record-payment-dialog";
import { useBooking } from "./bookings.hooks";
import { moneyToPaisa } from "./bookings.utils";

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1.5 break-words text-sm text-slate-800">{value}</dd></div>;
}

export function AdminBookingDetails({ id }: { id: string }) {
  const booking = useBooking(id);
  const [paymentOpen, setPaymentOpen] = useState(false);
  if (booking.isPending) return <div className="space-y-5"><Skeleton className="h-10 w-40" /><Skeleton className="h-32 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (booking.error || !booking.data) { const notFound = booking.error instanceof ApiError && booking.error.status === 404; return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold text-slate-950">{notFound ? "Booking not found" : "Booking details are unavailable"}</h1><p className="mt-2 text-sm text-slate-500">{getErrorMessage(booking.error)}</p><div className="mt-5 flex justify-center gap-3"><Button asChild variant="outline"><Link href="/admin/bookings">Back to Bookings</Link></Button>{!notFound ? <Button onClick={() => void booking.refetch()}>Try again</Button> : null}</div></CardContent></Card>; }
  const data = booking.data;
  const canRecord = data.status === "CONFIRMED" && moneyToPaisa(data.summary.pendingAmount) > BigInt(0);

  return <div className="space-y-6">
    <Button asChild variant="ghost" size="sm"><Link href="/admin/bookings"><ArrowLeft />Back to Bookings</Link></Button>
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{data.workRequest.title}</h1><StatusBadge status={data.status} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-1.5"><Building2 className="size-4" />{data.vendor.companyName}</span><span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(data.workRequest.eventDate)}</span><span className="flex items-center gap-1.5"><MapPin className="size-4" />{data.workRequest.eventLocation}</span></div><p className="mt-2 text-xs text-slate-400">Booked {formatDate(data.createdAt)}</p></div>{canRecord ? <Button onClick={() => setPaymentOpen(true)}><Plus />Record Payment</Button> : <Button disabled>{data.summary.paymentStatus === "PAID" ? "Fully Paid" : "Payment Unavailable"}</Button>}</section>
    <section className="grid gap-6 xl:grid-cols-2"><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileCheck2 className="size-5 text-indigo-600" />Booking Information</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><Detail label="Booking Reference" value={data.reference} /><Detail label="Work Request" value={data.workRequest.title} /><Detail label="Event Date" value={formatDate(data.workRequest.eventDate)} /><Detail label="Event Location" value={data.workRequest.eventLocation} /><Detail label="Booking Status" value={data.status} /><Detail label="Booking Date" value={formatDate(data.createdAt)} /></dl></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="size-5 text-indigo-600" />Selected Vendor</CardTitle></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2"><Detail label="Company" value={data.vendor.companyName} /><Detail label="Contact Person" value={data.vendor.contactPerson} /><Detail label="Email" value={data.vendor.email} /><Detail label="Phone" value={data.vendor.phone} /></dl></CardContent></Card></section>
    <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Accepted Quotation</CardTitle><CardDescription>The winning quotation selected for this booking.</CardDescription></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Accepted Amount" value={formatCurrency(data.bid.amount)} /><Detail label="Bid Status" value={data.bid.status} /><Detail label="Submitted" value={formatDate(data.bid.submittedAt)} /><Detail label="Quotation Notes" value={data.bid.notes ?? "No quotation notes provided"} /></dl></CardContent></Card>
    <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle><CardDescription>Authoritative payment totals calculated by the backend.</CardDescription></CardHeader><CardContent><FinancialSummary summary={data.summary} /></CardContent></Card>
    <PaymentHistory payments={data.payments} />
    <RecordPaymentDialog bookingId={data.id} summary={data.summary} open={paymentOpen} onOpenChange={setPaymentOpen} />
  </div>;
}
