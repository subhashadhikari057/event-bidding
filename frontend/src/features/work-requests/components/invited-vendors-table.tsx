"use client";

import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useVendors } from "@/features/vendors/vendors.hooks";
import { formatDate } from "@/lib/format";
import { useRequestInvitations } from "../work-requests.hooks";

export function InvitedVendorsTable({ requestId }: { requestId: string }) {
  const invitations = useRequestInvitations(requestId);
  const vendors = useVendors();
  const categoryById = new Map((vendors.data ?? []).map((vendor) => [vendor.id, vendor.category]));

  if (invitations.isPending) return <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;
  if (!invitations.data?.length) return <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"><Store className="size-6 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">No vendors invited yet</p><p className="mt-1 text-xs text-slate-500">Invite active vendors when this draft is ready.</p></div>;

  return <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Contact Person</TableHead><TableHead>Invited</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{invitations.data.map((invitation) => <TableRow key={invitation.id}><TableCell><p className="font-medium text-slate-900">{invitation.vendor.companyName}</p><p className="text-xs text-slate-500">{invitation.vendor.email}</p></TableCell><TableCell className="text-slate-600">{categoryById.get(invitation.vendor.id) ?? "—"}</TableCell><TableCell className="text-slate-600">{invitation.vendor.contactPerson}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{formatDate(invitation.createdAt)}</TableCell><TableCell><Badge className={invitation.status === "RESPONDED" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}>{invitation.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div>;
}
