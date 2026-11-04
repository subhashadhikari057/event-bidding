"use client";

import { useState } from "react";
import { LoaderCircle, Search, Send, Store } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api-client";
import { useVendors } from "@/features/vendors/vendors.hooks";
import { useInviteVendors, useRequestInvitations } from "../work-requests.hooks";

export function InviteVendorsDialog({ requestId, requestTitle, open, onOpenChange }: { requestId: string; requestTitle: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const vendors = useVendors();
  const invitations = useRequestInvitations(requestId);
  const invite = useInviteVendors();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const invitedIds = new Set((invitations.data ?? []).map((item) => item.vendor.id));
  const filtered = (vendors.data ?? []).filter((vendor) => [vendor.companyName, vendor.contactPerson, vendor.email, vendor.category ?? ""].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())));
  const toggle = (id: string, checked: boolean) => setSelected((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; });
  const pending = vendors.isPending || invitations.isPending;

  const submit = async () => {
    if (!selected.size) return;
    try {
      await invite.mutateAsync({ id: requestId, vendorIds: Array.from(selected) });
      toast.success("Vendors invited", { description: `${selected.size} vendor${selected.size === 1 ? "" : "s"} can now review this request.` });
      onOpenChange(false);
    } catch (error) { toast.error("Could not invite vendors", { description: getErrorMessage(error) }); }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!invite.isPending) { if (!next) { setSearch(""); setSelected(new Set()); } onOpenChange(next); } }}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-hidden sm:max-w-2xl">
        <DialogHeader><DialogTitle>Invite Vendors</DialogTitle><DialogDescription>Select vendors to receive <span className="font-medium text-slate-700">{requestTitle}</span> and submit quotations.</DialogDescription></DialogHeader>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendors…" className="pl-9" aria-label="Search vendors to invite" /></div>
        <div className="max-h-[50svh] space-y-2 overflow-y-auto pr-1">
          {pending ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />) : vendors.isError || invitations.isError ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{getErrorMessage(vendors.error ?? invitations.error)}</div> : filtered.length === 0 ? <div className="py-10 text-center"><Store className="mx-auto size-6 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">No vendors found</p></div> : filtered.map((vendor) => {
            const alreadyInvited = invitedIds.has(vendor.id);
            const disabled = alreadyInvited || !vendor.isActive;
            return <label key={vendor.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 has-[[data-state=checked]]:border-indigo-300 has-[[data-state=checked]]:bg-indigo-50/60">
              <Checkbox checked={selected.has(vendor.id)} disabled={disabled} onCheckedChange={(checked) => toggle(vendor.id, checked === true)} aria-label={`Select ${vendor.companyName}`} className="mt-1" />
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-medium text-slate-900">{vendor.companyName}</span>{alreadyInvited ? <Badge variant="outline">Already invited</Badge> : !vendor.isActive ? <Badge variant="outline">Inactive</Badge> : null}</span><span className="mt-1 block text-xs text-slate-500">{vendor.category ?? "Uncategorized"} · {vendor.contactPerson} · {vendor.email}</span></span>
            </label>;
          })}
        </div>
        <DialogFooter className="items-center sm:justify-between"><p className="mr-auto text-sm text-slate-500">{selected.size} selected</p><Button variant="outline" disabled={invite.isPending} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!selected.size || invite.isPending} onClick={() => void submit()}>{invite.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}{invite.isPending ? "Sending…" : "Send Invitations"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
