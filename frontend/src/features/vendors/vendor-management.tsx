"use client";

import { useDeferredValue, useState } from "react";
import { CircleOff, Plus, Search, Store, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { getErrorMessage } from "@/lib/api-client";
import { AddVendorDialog } from "./components/add-vendor-dialog";
import { EditVendorDialog } from "./components/edit-vendor-dialog";
import { ResetPasswordDialog } from "./components/reset-password-dialog";
import { VendorDetailsSheet } from "./components/vendor-details-sheet";
import { VendorStatusDialog } from "./components/vendor-status-dialog";
import { VendorTable } from "./components/vendor-table";
import { useVendors } from "./vendors.hooks";
import type { Vendor } from "./vendors.types";

type StatusFilter = "all" | "active" | "inactive";

export function VendorManagement() {
  const vendors = useVendors();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [status, setStatus] = useState<StatusFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [statusVendor, setStatusVendor] = useState<Vendor | null>(null);
  const [resetVendor, setResetVendor] = useState<Vendor | null>(null);

  const allVendors = vendors.data ?? [];
  const filteredVendors = allVendors.filter((vendor) => {
    const matchesStatus = status === "all" || vendor.isActive === (status === "active");
    const matchesSearch = !deferredSearch || [vendor.companyName, vendor.email, vendor.contactPerson, vendor.phone, vendor.category ?? ""].some((value) => value.toLowerCase().includes(deferredSearch));
    return matchesStatus && matchesSearch;
  });
  const activeCount = allVendors.filter((vendor) => vendor.isActive).length;
  const hasFilters = Boolean(search.trim()) || status !== "all";
  const clearFilters = () => { setSearch(""); setStatus("all"); };
  const leaveDetailsFor = (setter: (vendor: Vendor) => void, vendor: Vendor) => { setDetailsId(null); setter(vendor); };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-indigo-600">Admin Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Vendor Management</h1><p className="mt-2 text-sm text-slate-500">Manage vendor companies, accounts and access to Mero Event.</p></div>
        <Button className="w-full sm:w-auto" onClick={() => setAddOpen(true)}><Plus />Add Vendor</Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Vendor statistics">
        <StatCard title="Total Vendors" value={allVendors.length} helper="Registered companies" icon={Store} />
        <StatCard title="Active Vendors" value={activeCount} helper="Can access their accounts" icon={UserCheck} />
        <StatCard title="Inactive Vendors" value={allVendors.length - activeCount} helper="Access currently disabled" icon={CircleOff} />
      </section>

      <Card className="overflow-hidden border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><CardTitle className="text-lg">All Vendors</CardTitle><CardDescription className="mt-1">Search companies and manage vendor access.</CardDescription></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendors…" className="pl-9" aria-label="Search vendors" /></div>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}><SelectTrigger className="w-full sm:w-36" aria-label="Filter vendors by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
              {hasFilters ? <Button variant="ghost" onClick={clearFilters}>Clear</Button> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vendors.isError ? (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-medium text-red-800">Vendor list is unavailable</p><p className="mt-1 text-sm text-red-700">{getErrorMessage(vendors.error)}</p><Button variant="outline" size="sm" className="mt-4" onClick={() => void vendors.refetch()}>Try again</Button></div>
          ) : (
            <VendorTable vendors={filteredVendors} loading={vendors.isPending} hasFilters={hasFilters} onClearFilters={clearFilters} onView={(vendor) => setDetailsId(vendor.id)} onEdit={setEditVendor} onStatus={setStatusVendor} onResetPassword={setResetVendor} />
          )}
        </CardContent>
      </Card>

      <AddVendorDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditVendorDialog vendor={editVendor} open={Boolean(editVendor)} onOpenChange={(open) => !open && setEditVendor(null)} />
      <VendorStatusDialog vendor={statusVendor} open={Boolean(statusVendor)} onOpenChange={(open) => !open && setStatusVendor(null)} />
      <ResetPasswordDialog vendor={resetVendor} open={Boolean(resetVendor)} onOpenChange={(open) => !open && setResetVendor(null)} />
      <VendorDetailsSheet vendorId={detailsId} open={Boolean(detailsId)} onOpenChange={(open) => !open && setDetailsId(null)} onEdit={(vendor) => leaveDetailsFor(setEditVendor, vendor)} onStatus={(vendor) => leaveDetailsFor(setStatusVendor, vendor)} onResetPassword={(vendor) => leaveDetailsFor(setResetVendor, vendor)} />
    </div>
  );
}
