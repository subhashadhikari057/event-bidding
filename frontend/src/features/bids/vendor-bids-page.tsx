"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, FileText, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { BidDetailsDialog, type BidDetailView } from "./components/bid-details-dialog";
import { useVendorBids } from "./bids.hooks";
import type { BidStatus, VendorBid } from "./bids.types";

type Filter = "ALL" | BidStatus;

function detailFor(bid: VendorBid): BidDetailView {
  return { heading: bid.workRequest.title, subheading: "Your submitted quotation", eventDate: bid.workRequest.eventDate, eventLocation: bid.workRequest.eventLocation, amount: bid.amount, notes: bid.notes, submittedAt: bid.submittedAt, status: bid.status };
}

export function VendorBidsPage() {
  const bids = useVendorBids();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selected, setSelected] = useState<BidDetailView | null>(null);
  const all = bids.data ?? [];
  const filtered = all.filter((bid) => (filter === "ALL" || bid.status === filter) && (!deferredSearch || bid.workRequest.title.toLowerCase().includes(deferredSearch)));
  const hasFilters = Boolean(search.trim()) || filter !== "ALL";
  const clear = () => { setSearch(""); setFilter("ALL"); };

  return <div className="space-y-6"><section><p className="text-sm font-medium text-indigo-600">Vendor Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">My Quotations</h1><p className="mt-2 text-sm text-slate-500">Track your submitted quotations and their status.</p></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Quotation statistics"><StatCard title="Total Submitted Bids" value={all.length} helper="All final quotations" icon={FileText} /><StatCard title="Pending Decisions" value={all.filter((bid) => bid.status === "SUBMITTED").length} helper="Awaiting admin review" icon={Clock3} /><StatCard title="Accepted Bids" value={all.filter((bid) => bid.status === "ACCEPTED").length} helper="Selected quotations" icon={CheckCircle2} /><StatCard title="Rejected Bids" value={all.filter((bid) => bid.status === "REJECTED").length} helper="Not selected" icon={XCircle} /></section>
    <Card className="overflow-hidden border-slate-200 shadow-none"><CardHeader className="border-b border-slate-200"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><CardTitle className="text-lg">Submitted Quotations</CardTitle><CardDescription className="mt-1">Your private bid history across assigned requests.</CardDescription></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work requests…" className="pl-9" aria-label="Search quotations" /></div><Select value={filter} onValueChange={(value) => setFilter(value as Filter)}><SelectTrigger className="w-full sm:w-40" aria-label="Filter quotation status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="SUBMITTED">Submitted</SelectItem><SelectItem value="ACCEPTED">Accepted</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem></SelectContent></Select>{hasFilters ? <Button variant="ghost" onClick={clear}>Clear</Button> : null}</div></div></CardHeader><CardContent className="p-0">{bids.isError ? <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Quotations are unavailable</p><p className="mt-1 text-sm text-red-700">{getErrorMessage(bids.error)}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void bids.refetch()}>Try again</Button></div> : !bids.isPending && !filtered.length ? <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><FileText className="size-7 text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">{hasFilters ? "No quotations match" : "You haven't submitted any quotations yet."}</h2><p className="mt-1 text-sm text-slate-500">Review open invitations and submit your first final quotation.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/vendor/requests">View Assigned Requests</Link></Button></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Work Request</TableHead><TableHead>Event Date</TableHead><TableHead>Quotation Amount</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="pr-6 text-right">Action</TableHead></TableRow></TableHeader><TableBody>{bids.isPending ? Array.from({ length: 4 }, (_, index) => <TableRow key={index}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell} className={cell === 0 ? "pl-6" : cell === 5 ? "pr-6" : ""}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>) : filtered.map((bid) => <TableRow key={bid.id}><TableCell className="pl-6"><p className="font-medium text-slate-900">{bid.workRequest.title}</p><p className="mt-1 text-xs text-slate-500">{bid.workRequest.eventLocation}</p></TableCell><TableCell className="whitespace-nowrap text-slate-600">{formatDate(bid.workRequest.eventDate)}</TableCell><TableCell className="whitespace-nowrap font-semibold text-slate-900">{formatCurrency(bid.amount)}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(bid.submittedAt)}</TableCell><TableCell><StatusBadge status={bid.status} /></TableCell><TableCell className="pr-6 text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(detailFor(bid))}>View Details</Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card><BidDetailsDialog bid={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
  </div>;
}
