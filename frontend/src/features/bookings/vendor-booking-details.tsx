"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { FinancialSummary } from "./components/financial-summary";
import { PaymentHistory } from "./components/payment-history";
import { useVendorBookings } from "./bookings.hooks";

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1.5 break-words text-sm text-slate-800">{value}</dd></div>;
}

export function VendorBookingDetails({ id }: { id: string }) {
  const bookings = useVendorBookings();
  if (bookings.isPending) return <div className="space-y-5"><Skeleton className="h-10 w-40" /><Skeleton className="h-32 w-full" /><Skeleton className="h-72 w-full" /></div>;
  if (bookings.error) return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold">Booking details are unavailable</h1><p className="mt-2 text-sm text-slate-500">{getErrorMessage(bookings.error)}</p><Button className="mt-5" onClick={() => void bookings.refetch()}>Try again</Button></CardContent></Card>;
  const booking = bookings.data?.find((item) => item.id === id);
  if (!booking) return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold text-slate-950">Booking not found</h1><p className="mt-2 text-sm text-slate-500">This booking is not part of your authorized vendor account.</p><Button asChild variant="outline" className="mt-5"><Link href="/vendor/bookings">Back to My Bookings</Link></Button></CardContent></Card>;

  return <div className="space-y-6"><Button asChild variant="ghost" size="sm"><Link href="/vendor/bookings"><ArrowLeft />Back to My Bookings</Link></Button><section><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{booking.workRequest.title}</h1><StatusBadge status={booking.status} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(booking.workRequest.eventDate)}</span><span className="flex items-center gap-1.5"><MapPin className="size-4" />{booking.workRequest.eventLocation}</span></div><p className="mt-2 text-xs text-slate-400">Booking confirmed {formatDate(booking.createdAt)}</p></section><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Booking Information</CardTitle><CardDescription>Read-only details for work awarded to your company.</CardDescription></CardHeader><CardContent><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Booking Reference" value={booking.reference} /><Detail label="Booking Status" value={booking.status} /><Detail label="Accepted Quotation" value={formatCurrency(booking.acceptedAmount)} /><Detail label="Payment Status" value={booking.summary.paymentStatus.replaceAll("_", " ")} /><Detail label="Event Date" value={formatDate(booking.workRequest.eventDate)} /><Detail label="Event Location" value={booking.workRequest.eventLocation} /><Detail label="Work Request Status" value={booking.workRequest.status} /><Detail label="Booking Date" value={formatDate(booking.createdAt)} /></dl></CardContent></Card><Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Payment Summary</CardTitle><CardDescription>Payment amounts recorded by Mero Event for this booking.</CardDescription></CardHeader><CardContent><FinancialSummary summary={booking.summary} /></CardContent></Card><PaymentHistory payments={booking.payments} /></div>;
}
