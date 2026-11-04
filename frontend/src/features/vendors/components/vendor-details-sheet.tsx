"use client";

import { CalendarDays, KeyRound, Mail, MapPin, Pencil, Phone, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useVendor } from "../vendors.hooks";
import type { Vendor } from "../vendors.types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-6 py-2"><dt className="text-sm text-slate-500">{label}</dt><dd className="text-right text-sm font-medium text-slate-900">{value}</dd></div>;
}

export function VendorDetailsSheet({
  vendorId,
  open,
  onOpenChange,
  onEdit,
  onStatus,
  onResetPassword,
}: {
  vendorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (vendor: Vendor) => void;
  onStatus: (vendor: Vendor) => void;
  onResetPassword: (vendor: Vendor) => void;
}) {
  const detail = useVendor(vendorId, open);
  const vendor = detail.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b border-slate-200 pb-5"><SheetTitle>Vendor Details</SheetTitle><SheetDescription>Company, contact and linked account information.</SheetDescription></SheetHeader>
        {detail.isPending ? (
          <div className="space-y-6 px-4 py-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-44 w-full" /><Skeleton className="h-36 w-full" /></div>
        ) : detail.isError ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">Vendor details are unavailable</p>
            <p className="mt-1 text-sm text-red-700">{getErrorMessage(detail.error)}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void detail.refetch()}>Try again</Button>
          </div>
        ) : vendor ? (
          <div className="space-y-6 px-4 py-6">
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold text-slate-950">{vendor.companyName}</p><p className="mt-1 text-sm text-slate-500">{vendor.category ?? "Uncategorized"}</p></div><Badge className={vendor.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}>{vendor.isActive ? "Active" : "Inactive"}</Badge></div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin className="size-4 text-slate-400" />{vendor.address ?? "Address not provided"}</div>
            </section>
            <section><h3 className="text-sm font-semibold text-slate-950">Contact Information</h3><div className="mt-2 divide-y divide-slate-100"><DetailRow label="Contact Person" value={vendor.contactPerson} /><DetailRow label="Email" value={vendor.email} /><DetailRow label="Phone" value={vendor.phone} /></div><div className="mt-3 flex flex-wrap gap-2"><a href={`mailto:${vendor.email}`} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"><Mail className="size-4" />Email</a><a href={`tel:${vendor.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"><Phone className="size-4" />Call</a></div></section>
            <section><h3 className="text-sm font-semibold text-slate-950">Account Information</h3><div className="mt-2 divide-y divide-slate-100"><DetailRow label="Linked Account" value={vendor.user?.email ?? "Not available"} /><DetailRow label="Account Status" value={vendor.user?.isActive ? "Active" : "Inactive"} /><DetailRow label="Role" value={vendor.user?.role ?? "VENDOR"} /><DetailRow label="Created" value={formatDate(vendor.createdAt)} /></div><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="size-4" />Last updated {formatDate(vendor.updatedAt)}</div></section>
          </div>
        ) : null}
        {vendor ? (
          <SheetFooter className="mt-auto border-t border-slate-200">
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => onEdit(vendor)}><Pencil />Edit Vendor</Button>
              <Button variant="outline" disabled={!vendor.isActive} onClick={() => onResetPassword(vendor)}><KeyRound />Reset Password</Button>
              <Button variant="outline" className="sm:col-span-2" onClick={() => onStatus(vendor)}><Power />{vendor.isActive ? "Deactivate" : "Activate"} Vendor</Button>
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
