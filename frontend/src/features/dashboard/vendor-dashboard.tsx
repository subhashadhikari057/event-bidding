"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, ClipboardList, FileClock, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardLoadingState } from "@/components/shared/loading-state";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/features/auth/use-auth";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { dashboardApi } from "./dashboard.api";

export function VendorDashboard() {
  const auth = useAuth();
  const requests = useQuery({ queryKey: ["vendor", "requests"], queryFn: ({ signal }) => dashboardApi.vendor.requests(signal) });
  const bids = useQuery({ queryKey: ["vendor", "bids"], queryFn: ({ signal }) => dashboardApi.vendor.bids(signal) });
  const bookings = useQuery({ queryKey: ["vendor", "bookings"], queryFn: ({ signal }) => dashboardApi.vendor.bookings(signal) });
  const loading = requests.isPending || bids.isPending || bookings.isPending;
  const error = requests.error ?? bids.error ?? bookings.error;

  if (loading) return <DashboardLoadingState />;
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-none">
        <CardHeader><CardTitle className="text-base text-red-800">Dashboard data is unavailable</CardTitle><CardDescription className="text-red-700">{getErrorMessage(error)}</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={() => void Promise.all([requests.refetch(), bids.refetch(), bookings.refetch()])}>Try again</Button></CardContent>
      </Card>
    );
  }

  const requestData = requests.data ?? [];
  const bidData = bids.data ?? [];
  const bookingData = bookings.data ?? [];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-indigo-600">Vendor workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Welcome back, {auth.user?.name}</h1>
        <p className="mt-2 text-sm text-slate-500">Manage your event invitations, quotations and bookings.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
        <StatCard title="Assigned Requests" value={requestData.length} helper="All requests assigned to you" icon={ClipboardList} />
        <StatCard title="Pending Quotations" value={requestData.filter((request) => request.status === "PENDING" && request.workRequest.status === "OPEN").length} helper="Open invitations awaiting a bid" icon={FileClock} />
        <StatCard title="Submitted Bids" value={bidData.length} helper="Final quotations submitted" icon={Gavel} />
        <StatCard title="Confirmed Bookings" value={bookingData.filter((booking) => booking.status === "CONFIRMED").length} helper="Events awarded to your company" icon={BriefcaseBusiness} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="text-lg">Assigned Requests</CardTitle><CardDescription>Your latest invitations from Mero Event.</CardDescription></CardHeader>
          <CardContent className="px-0">
            {requestData.length === 0 ? <EmptyState icon={ClipboardList} title="No assigned requests" description="New invitations will appear here when Mero Event assigns work." /> : (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Request</TableHead><TableHead>Date</TableHead><TableHead>Invitation</TableHead><TableHead className="pr-6">Request</TableHead></TableRow></TableHeader><TableBody>
                {requestData.slice(0, 5).map((request) => <TableRow key={request.id}><TableCell className="pl-6"><p className="max-w-48 truncate font-medium text-slate-900">{request.workRequest.title}</p><p className="mt-1 text-xs text-slate-500">{request.workRequest.eventLocation}</p></TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(request.workRequest.eventDate)}</TableCell><TableCell><StatusBadge status={request.status} /></TableCell><TableCell className="pr-6"><StatusBadge status={request.workRequest.status} /></TableCell></TableRow>)}
              </TableBody></Table></div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="text-lg">Recent Bids</CardTitle><CardDescription>Your latest submitted quotations.</CardDescription></CardHeader>
          <CardContent className="px-0">
            {bidData.length === 0 ? <EmptyState icon={Gavel} title="No bids submitted" description="Submitted quotations will appear here." /> : (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Request</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead className="pr-6">Status</TableHead></TableRow></TableHeader><TableBody>
                {bidData.slice(0, 5).map((bid) => <TableRow key={bid.id}><TableCell className="max-w-48 truncate pl-6 font-medium text-slate-900">{bid.workRequest.title}</TableCell><TableCell className="whitespace-nowrap font-medium">{formatCurrency(bid.amount)}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(bid.submittedAt)}</TableCell><TableCell className="pr-6"><StatusBadge status={bid.status} /></TableCell></TableRow>)}
              </TableBody></Table></div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200 shadow-none">
        <CardHeader><CardTitle className="text-lg">Recent Bookings</CardTitle><CardDescription>Confirmed events and payment progress.</CardDescription></CardHeader>
        <CardContent className="px-0">
          {bookingData.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="No confirmed bookings" description="Bookings awarded to your company will appear here." /> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Event</TableHead><TableHead>Booking Amount</TableHead><TableHead>Paid</TableHead><TableHead>Pending</TableHead><TableHead className="pr-6">Payment</TableHead></TableRow></TableHeader><TableBody>
              {bookingData.slice(0, 5).map((booking) => <TableRow key={booking.id}><TableCell className="pl-6"><p className="max-w-56 truncate font-medium text-slate-900">{booking.workRequest.title}</p><p className="mt-1 text-xs text-slate-500">{formatDate(booking.workRequest.eventDate)}</p></TableCell><TableCell className="whitespace-nowrap">{formatCurrency(booking.acceptedAmount)}</TableCell><TableCell className="whitespace-nowrap text-emerald-700">{formatCurrency(booking.summary.totalPaid)}</TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatCurrency(booking.summary.pendingAmount)}</TableCell><TableCell className="pr-6"><StatusBadge status={booking.summary.paymentStatus} /></TableCell></TableRow>)}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
