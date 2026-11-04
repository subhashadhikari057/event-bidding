"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useAssignedRequests } from "./work-requests.hooks";
import type { InvitationStatus } from "./work-requests.types";

type Filter = "ALL" | InvitationStatus;

export function VendorRequestList() {
  const requests = useAssignedRequests();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [filter, setFilter] = useState<Filter>("ALL");
  const all = requests.data ?? [];
  const filtered = all.filter((item) => (filter === "ALL" || item.status === filter) && (!deferredSearch || item.workRequest.title.toLowerCase().includes(deferredSearch)));
  const hasFilters = Boolean(search.trim()) || filter !== "ALL";
  const clear = () => { setSearch(""); setFilter("ALL"); };

  return <div className="space-y-6"><section><p className="text-sm font-medium text-indigo-600">Vendor Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Assigned Requests</h1><p className="mt-2 text-sm text-slate-500">Review event requirements and manage your quotation opportunities.</p></section>
    <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader className="border-b border-slate-200"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="text-lg">Your Invitations</CardTitle><CardDescription className="mt-1">Only requests assigned to your vendor account appear here.</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assigned requests…" className="pl-9" aria-label="Search assigned requests" /></div><Select value={filter} onValueChange={(value) => setFilter(value as Filter)}><SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All invitations</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="RESPONDED">Responded</SelectItem></SelectContent></Select>{hasFilters ? <Button variant="ghost" onClick={clear}>Clear</Button> : null}</div></div></CardHeader><CardContent className="p-0">
      {requests.isError ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Assigned requests are unavailable</p><p className="mt-1 text-sm text-red-700">{getErrorMessage(requests.error)}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void requests.refetch()}>Try again</Button></div> : !requests.isPending && !filtered.length ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><ClipboardList className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">{hasFilters ? "No invitations match" : "No assigned requests"}</h2><p className="mt-1 text-sm text-slate-500">{hasFilters ? "Try another search or invitation status." : "New invitations will appear when Mero Event assigns work to you."}</p>{hasFilters ? <Button variant="outline" size="sm" className="mt-4" onClick={clear}>Clear filters</Button> : null}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Work Request</TableHead><TableHead>Event Date</TableHead><TableHead>Location</TableHead><TableHead>Invitation</TableHead><TableHead>Request</TableHead><TableHead className="pr-6 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{requests.isPending ? Array.from({ length: 4 }, (_, index) => <TableRow key={index}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell} className={cell === 0 ? "pl-6" : cell === 5 ? "pr-6" : ""}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>) : filtered.map((item) => <TableRow key={item.id}><TableCell className="pl-6"><Link href={`/vendor/requests/${item.workRequest.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline">{item.workRequest.title}</Link><p className="mt-1 text-xs text-slate-500">Invited {formatDate(item.createdAt)}</p></TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatDate(item.workRequest.eventDate)}</TableCell><TableCell><span className="flex items-center gap-1.5 whitespace-nowrap text-slate-600"><MapPin className="size-3.5" />{item.workRequest.eventLocation}</span></TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell><StatusBadge status={item.workRequest.status} /></TableCell><TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" asChild><Link href={`/vendor/requests/${item.workRequest.id}`}>View Details<ArrowRight /></Link></Button></TableCell></TableRow>)}</TableBody></Table></div>}
    </CardContent></Card>
  </div>;
}
