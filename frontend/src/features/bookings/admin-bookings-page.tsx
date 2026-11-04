"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, BriefcaseBusiness, CircleDollarSign, Search, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { useBookings } from "./bookings.hooks";
import { sumMoney } from "./bookings.utils";

export function AdminBookingsPage() {
  const bookings = useBookings();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [bookingStatus, setBookingStatus] = useState("ALL");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const data = useMemo(() => bookings.data ?? [], [bookings.data]);
  const filtered = useMemo(() => data.filter((booking) => {
    const matchesSearch = !deferredSearch || booking.workRequest.title.toLowerCase().includes(deferredSearch) || booking.vendor.companyName.toLowerCase().includes(deferredSearch);
    return matchesSearch && (paymentStatus === "ALL" || booking.summary.paymentStatus === paymentStatus) && (bookingStatus === "ALL" || booking.status === bookingStatus);
  }), [bookingStatus, data, deferredSearch, paymentStatus]);
  const hasFilters = Boolean(search) || paymentStatus !== "ALL" || bookingStatus !== "ALL";
  const clearFilters = () => { setSearch(""); setPaymentStatus("ALL"); setBookingStatus("ALL"); };

  if (bookings.isPending) return <div className="space-y-6"><Skeleton className="h-24 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div><Skeleton className="h-80 w-full" /></div>;
  if (bookings.error) return <Card className="border-red-200 bg-red-50 shadow-none"><CardHeader><CardTitle className="text-red-800">Bookings are unavailable</CardTitle><CardDescription className="text-red-700">{getErrorMessage(bookings.error)}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => void bookings.refetch()}>Try again</Button></CardContent></Card>;

  return (
    <div className="space-y-7">
      <section><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Bookings &amp; Payments</h1><p className="mt-2 text-sm text-slate-500">Manage confirmed vendor bookings and track payment balances.</p></section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Booking statistics">
        <StatCard title="Total Booking Value" value={formatCurrency(sumMoney(data.map((booking) => booking.summary.bookingAmount)))} helper="Across all returned bookings" icon={WalletCards} />
        <StatCard title="Total Amount Paid" value={formatCurrency(sumMoney(data.map((booking) => booking.summary.totalPaid)))} helper="External payments recorded" icon={CircleDollarSign} />
        <StatCard title="Total Pending Amount" value={formatCurrency(sumMoney(data.map((booking) => booking.summary.pendingAmount)))} helper="Outstanding booking balances" icon={Banknote} />
        <StatCard title="Confirmed Bookings" value={data.filter((booking) => booking.status === "CONFIRMED").length} helper={`${data.length} total booking${data.length === 1 ? "" : "s"}`} icon={BriefcaseBusiness} />
      </section>
      <Card className="overflow-hidden border-slate-200 shadow-none">
        <CardHeader><CardTitle className="text-lg">All Bookings</CardTitle><CardDescription>Review selected vendors, event dates and payment progress.</CardDescription><div className="flex flex-col gap-3 pt-3 lg:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search event or vendor…" className="pl-9" aria-label="Search bookings" /></div><Select value={paymentStatus} onValueChange={setPaymentStatus}><SelectTrigger className="w-full lg:w-48" aria-label="Filter by payment status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All payment statuses</SelectItem><SelectItem value="UNPAID">Unpaid</SelectItem><SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem><SelectItem value="PAID">Paid</SelectItem></SelectContent></Select><Select value={bookingStatus} onValueChange={setBookingStatus}><SelectTrigger className="w-full lg:w-44" aria-label="Filter by booking status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All booking statuses</SelectItem><SelectItem value="CONFIRMED">Confirmed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select>{hasFilters ? <Button variant="ghost" onClick={clearFilters}><X />Clear filters</Button> : null}</div></CardHeader>
        <CardContent className="p-0">
          {data.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="No bookings yet" description="A booking will appear here after an admin accepts a vendor quotation." /> : filtered.length === 0 ? <EmptyState icon={Search} title="No matching bookings" description="Try adjusting your search or clearing the selected filters." /> : <>
            <div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow><TableHead className="pl-6">Event / Work Request</TableHead><TableHead>Selected Vendor</TableHead><TableHead>Event Date</TableHead><TableHead>Booking Amount</TableHead><TableHead>Total Paid</TableHead><TableHead>Pending</TableHead><TableHead>Payment</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((booking) => <TableRow key={booking.id}><TableCell className="max-w-52 truncate pl-6 font-medium text-slate-950">{booking.workRequest.title}</TableCell><TableCell className="max-w-44 truncate text-slate-600">{booking.vendor.companyName}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(booking.workRequest.eventDate)}</TableCell><TableCell className="whitespace-nowrap font-medium">{formatCurrency(booking.summary.bookingAmount)}</TableCell><TableCell className="whitespace-nowrap text-emerald-700">{formatCurrency(booking.summary.totalPaid)}</TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatCurrency(booking.summary.pendingAmount)}</TableCell><TableCell><StatusBadge status={booking.summary.paymentStatus} /></TableCell><TableCell className="pr-6 text-right"><Button asChild variant="ghost" size="sm"><Link href={`/admin/bookings/${booking.id}`}>View Details</Link></Button></TableCell></TableRow>)}</TableBody></Table></div>
            <div className="divide-y divide-slate-200 md:hidden">{filtered.map((booking) => <article key={booking.id} className="space-y-4 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{booking.workRequest.title}</h2><p className="mt-1 text-sm text-slate-500">{booking.vendor.companyName}</p></div><StatusBadge status={booking.summary.paymentStatus} /></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Event date</dt><dd className="mt-1 text-slate-800">{formatDate(booking.workRequest.eventDate)}</dd></div><div><dt className="text-xs text-slate-500">Booking amount</dt><dd className="mt-1 font-medium text-slate-900">{formatCurrency(booking.summary.bookingAmount)}</dd></div><div><dt className="text-xs text-slate-500">Paid</dt><dd className="mt-1 text-emerald-700">{formatCurrency(booking.summary.totalPaid)}</dd></div><div><dt className="text-xs text-slate-500">Pending</dt><dd className="mt-1 text-slate-800">{formatCurrency(booking.summary.pendingAmount)}</dd></div></dl><Button asChild variant="outline" className="w-full"><Link href={`/admin/bookings/${booking.id}`}>View Booking Details</Link></Button></article>)}</div>
          </>}
        </CardContent>
      </Card>
    </div>
  );
}
