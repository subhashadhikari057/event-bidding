"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, FileClock, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useWorkRequests } from "@/features/work-requests/work-requests.hooks";
import type { WorkRequestStatus } from "@/features/work-requests/work-requests.types";

type Filter = "ALL" | WorkRequestStatus;

export function AdminBidsPage() {
  const requests = useWorkRequests();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [filter, setFilter] = useState<Filter>("ALL");
  const all = requests.data ?? [];
  const filtered = all.filter((request) => (filter === "ALL" || request.status === filter) && (!deferredSearch || request.title.toLowerCase().includes(deferredSearch)));
  const hasFilters = Boolean(search.trim()) || filter !== "ALL";
  const clear = () => { setSearch(""); setFilter("ALL"); };

  return <div className="space-y-6"><section><p className="text-sm font-medium text-indigo-600">Admin Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Bidding Management</h1><p className="mt-2 text-sm text-slate-500">Review vendor quotations and select the best service providers.</p></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Bidding statistics"><StatCard title="Total Work Requests" value={all.length} helper="Requests across all stages" icon={ClipboardList} /><StatCard title="Open Work Requests" value={all.filter((item) => item.status === "OPEN").length} helper="Eligible for vendor selection" icon={CalendarClock} /><StatCard title="Confirmed Selections" value={all.filter((item) => item.status === "BOOKED").length} helper="Requests with a booking" icon={Trophy} /><StatCard title="Draft Requests" value={all.filter((item) => item.status === "DRAFT").length} helper="Not yet accepting bids" icon={FileClock} /></section>
    <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader className="border-b border-slate-200"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="text-lg">Work Request Quotations</CardTitle><CardDescription className="mt-1">Open a request to compare its submitted bids. Bid counts are loaded only on comparison pages to avoid excessive requests.</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work requests…" className="pl-9" aria-label="Search bidding requests" /></div><Select value={filter} onValueChange={(value) => setFilter(value as Filter)}><SelectTrigger className="w-full sm:w-40" aria-label="Filter request status"><SelectValue /></SelectTrigger><SelectContent>{["ALL", "DRAFT", "OPEN", "BOOKED", "CANCELLED"].map((value) => <SelectItem key={value} value={value}>{value === "ALL" ? "All statuses" : value}</SelectItem>)}</SelectContent></Select>{hasFilters ? <Button variant="ghost" onClick={clear}>Clear</Button> : null}</div></div></CardHeader><CardContent className="p-0">{requests.isError ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Bidding requests are unavailable</p><p className="mt-1 text-sm text-red-700">{getErrorMessage(requests.error)}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void requests.refetch()}>Try again</Button></div> : !requests.isPending && !filtered.length ? <div className="flex min-h-72 flex-col items-center justify-center text-center"><Trophy className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">No requests match your filters</h2>{hasFilters ? <Button variant="outline" size="sm" className="mt-4" onClick={clear}>Clear filters</Button> : null}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Work Request</TableHead><TableHead>Event Date</TableHead><TableHead>Location</TableHead><TableHead>Invited Vendors</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{requests.isPending ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell} className={cell === 0 ? "pl-6" : cell === 5 ? "pr-6" : ""}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>) : filtered.map((request) => <TableRow key={request.id}><TableCell className="pl-6"><p className="font-medium text-slate-900">{request.title}</p><p className="mt-1 text-xs text-slate-500">Created {formatDate(request.createdAt)}</p></TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatDate(request.eventDate)}</TableCell><TableCell className="text-slate-600">{request.eventLocation}</TableCell><TableCell>{request._count.invitations}</TableCell><TableCell><StatusBadge status={request.status} /></TableCell><TableCell className="pr-6"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" asChild><Link href={`/admin/work-requests/${request.id}`}>View Request</Link></Button><Button variant="outline" size="sm" asChild><Link href={`/admin/work-requests/${request.id}/bids`}>Compare Bids</Link></Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
  </div>;
}
