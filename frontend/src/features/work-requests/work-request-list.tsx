"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, FileClock, MapPin, MoreHorizontal, Pencil, Plus, Search, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { InviteVendorsDialog } from "./components/invite-vendors-dialog";
import { useWorkRequests } from "./work-requests.hooks";
import type { WorkRequestStatus, WorkRequestSummary } from "./work-requests.types";

type StatusFilter = "ALL" | WorkRequestStatus;

export function WorkRequestList() {
  const requests = useWorkRequests();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [inviteRequest, setInviteRequest] = useState<WorkRequestSummary | null>(null);
  const all = requests.data ?? [];
  const filtered = all.filter((request) => (status === "ALL" || request.status === status) && (!deferredSearch || request.title.toLowerCase().includes(deferredSearch) || request.eventLocation.toLowerCase().includes(deferredSearch)));
  const hasFilters = Boolean(search.trim()) || status !== "ALL";
  const clear = () => { setSearch(""); setStatus("ALL"); };

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-indigo-600">Admin Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Work Requests</h1><p className="mt-2 text-sm text-slate-500">Create and manage event quotation requests for your vendors.</p></div><Button asChild><Link href="/admin/work-requests/new"><Plus />Create Work Request</Link></Button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Work request statistics"><StatCard title="Total Requests" value={all.length} helper="All event requirements" icon={ClipboardList} /><StatCard title="Draft Requests" value={all.filter((item) => item.status === "DRAFT").length} helper="Not yet shared" icon={FileClock} /><StatCard title="Open Requests" value={all.filter((item) => item.status === "OPEN").length} helper="Accepting quotations" icon={CalendarClock} /><StatCard title="Booked Requests" value={all.filter((item) => item.status === "BOOKED").length} helper="Vendor confirmed" icon={CheckCircle2} /></section>
    <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader className="border-b border-slate-200"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="text-lg">All Work Requests</CardTitle><CardDescription className="mt-1">Track event requirements and vendor outreach.</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or location…" className="pl-9" aria-label="Search work requests" /></div><Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}><SelectTrigger className="w-full sm:w-40" aria-label="Filter requests by status"><SelectValue /></SelectTrigger><SelectContent>{["ALL", "DRAFT", "OPEN", "BOOKED", "CANCELLED"].map((value) => <SelectItem key={value} value={value}>{value === "ALL" ? "All statuses" : value}</SelectItem>)}</SelectContent></Select>{hasFilters ? <Button variant="ghost" onClick={clear}>Clear</Button> : null}</div></div></CardHeader><CardContent className="p-0">
      {requests.isError ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Work requests are unavailable</p><p className="mt-1 text-sm text-red-700">{getErrorMessage(requests.error)}</p><Button size="sm" variant="outline" className="mt-4" onClick={() => void requests.refetch()}>Try again</Button></div> : !requests.isPending && filtered.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><ClipboardList className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">{hasFilters ? "No requests match your filters" : "No work requests yet"}</h2><p className="mt-1 text-sm text-slate-500">{hasFilters ? "Try another title, location or status." : "Create a draft request to start collecting vendor quotations."}</p>{hasFilters ? <Button size="sm" variant="outline" className="mt-4" onClick={clear}>Clear filters</Button> : null}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Request Title</TableHead><TableHead>Event Date</TableHead><TableHead>Location</TableHead><TableHead>Items</TableHead><TableHead>Invited</TableHead><TableHead>Status</TableHead><TableHead className="w-16 pr-6 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{requests.isPending ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 7 }, (_, cell) => <TableCell key={cell} className={cell === 0 ? "pl-6" : cell === 6 ? "pr-6" : ""}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>) : filtered.map((request) => {
        const canInvite = request.status === "DRAFT" || request.status === "OPEN";
        return <TableRow key={request.id}><TableCell className="pl-6"><Link href={`/admin/work-requests/${request.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline">{request.title}</Link><p className="mt-1 text-xs text-slate-500">Created {formatDate(request.createdAt)}</p></TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatDate(request.eventDate)}</TableCell><TableCell><span className="flex items-center gap-1.5 whitespace-nowrap text-slate-600"><MapPin className="size-3.5 text-slate-400" />{request.eventLocation}</span></TableCell><TableCell>{request._count.items}</TableCell><TableCell>{request._count.invitations}</TableCell><TableCell><StatusBadge status={request.status} /></TableCell><TableCell className="pr-6 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${request.title}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem className="h-9 whitespace-nowrap px-2 text-sm font-normal leading-5" asChild><Link href={`/admin/work-requests/${request.id}`}><UserRound />View Details</Link></DropdownMenuItem>{request.status === "DRAFT" ? <DropdownMenuItem className="h-9 whitespace-nowrap px-2 text-sm font-normal leading-5" asChild><Link href={`/admin/work-requests/${request.id}/edit`}><Pencil />Edit Request</Link></DropdownMenuItem> : <DropdownMenuItem className="h-9 whitespace-nowrap px-2 text-sm font-normal leading-5" disabled><Pencil /><span>Edit Request</span></DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem className="h-9 whitespace-nowrap px-2 text-sm font-normal leading-5" disabled={!canInvite} onSelect={() => canInvite && setInviteRequest(request)}><Send />Invite Vendors</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
      })}</TableBody></Table></div>}
    </CardContent></Card>
    {inviteRequest ? <InviteVendorsDialog requestId={inviteRequest.id} requestTitle={inviteRequest.title} open onOpenChange={(open) => !open && setInviteRequest(null)} /> : null}
  </div>;
}
