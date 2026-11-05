"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpenCheck, BriefcaseBusiness, ClipboardList, Plus, Store, TicketCheck } from "lucide-react";
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

export function AdminDashboard() {
  const auth = useAuth();
  const vendors = useQuery({ queryKey: ["admin", "vendors"], queryFn: ({ signal }) => dashboardApi.admin.vendors(signal) });
  const requests = useQuery({ queryKey: ["admin", "work-requests"], queryFn: ({ signal }) => dashboardApi.admin.workRequests(signal) });
  const bookings = useQuery({ queryKey: ["admin", "bookings"], queryFn: ({ signal }) => dashboardApi.admin.bookings(signal) });
  const loading = vendors.isPending || requests.isPending || bookings.isPending;
  const error = vendors.error ?? requests.error ?? bookings.error;

  if (loading) return <DashboardLoadingState />;
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-none">
        <CardHeader><CardTitle className="text-base text-red-800">Dashboard data is unavailable</CardTitle><CardDescription className="text-red-700">{getErrorMessage(error)}</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={() => void Promise.all([vendors.refetch(), requests.refetch(), bookings.refetch()])}>Try again</Button></CardContent>
      </Card>
    );
  }

  const vendorData = vendors.data ?? [];
  const requestData = requests.data ?? [];
  const bookingData = bookings.data ?? [];
  const recentRequests = requestData.slice(0, 5);
  const recentBookings = bookingData.slice(0, 5);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-indigo-600">Welcome back, {auth.user?.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor your vendors, work requests and bookings.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
        <StatCard title="Total Vendors" value={vendorData.length} helper={`${vendorData.filter((vendor) => vendor.isActive).length} active accounts`} icon={Store} />
        <StatCard title="Open Work Requests" value={requestData.filter((request) => request.status === "OPEN").length} helper="Currently accepting quotations" icon={ClipboardList} />
        <StatCard title="Bids Received" value="—" helper="Available within request details" icon={TicketCheck} />
        <StatCard title="Confirmed Bookings" value={bookingData.filter((booking) => booking.status === "CONFIRMED").length} helper="Active confirmed events" icon={BriefcaseBusiness} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="text-lg">Recent Work Requests</CardTitle><CardDescription>Latest event requirements created by your team.</CardDescription></CardHeader>
          <CardContent className="px-0">
            {recentRequests.length === 0 ? <EmptyState icon={ClipboardList} title="No work requests yet" description="Created work requests will appear here." /> : (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Request</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead className="pr-6">Status</TableHead></TableRow></TableHeader><TableBody>
                {recentRequests.map((request) => <TableRow key={request.id}><TableCell className="max-w-48 truncate pl-6 font-medium text-slate-900">{request.title}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(request.eventDate)}</TableCell><TableCell className="text-slate-500">{request.eventLocation}</TableCell><TableCell className="pr-6"><StatusBadge status={request.status} /></TableCell></TableRow>)}
              </TableBody></Table></div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardHeader><CardTitle className="text-lg">Recent Bookings</CardTitle><CardDescription>Latest confirmed vendor engagements.</CardDescription></CardHeader>
          <CardContent className="px-0">
            {recentBookings.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="No bookings yet" description="Accepted bids will create bookings here." /> : (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Event</TableHead><TableHead>Vendor</TableHead><TableHead>Amount</TableHead><TableHead className="pr-6">Payment</TableHead></TableRow></TableHeader><TableBody>
                {recentBookings.map((booking) => <TableRow key={booking.id}><TableCell className="max-w-44 truncate pl-6 font-medium text-slate-900">{booking.workRequest.title}</TableCell><TableCell className="max-w-40 truncate text-slate-500">{booking.vendor.companyName}</TableCell><TableCell className="whitespace-nowrap font-medium">{formatCurrency(booking.amount)}</TableCell><TableCell className="pr-6"><StatusBadge status={booking.summary.paymentStatus} /></TableCell></TableRow>)}
              </TableBody></Table></div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2><p className="mt-1 text-sm text-slate-500">Jump directly to common management tasks.</p></div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild><Link href="/admin/vendors"><Plus />Add Vendor</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/work-requests/new"><ClipboardList />Create Work Request</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/bookings"><BookOpenCheck />View Bookings</Link></Button>
        </div>
      </section>
    </div>
  );
}
