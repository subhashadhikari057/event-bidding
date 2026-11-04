"use client";

import { KeyRound, MoreHorizontal, Pencil, Power, Search, Store, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { userInitials } from "@/lib/format";
import type { Vendor } from "../vendors.types";

interface VendorTableProps {
  vendors: Vendor[];
  loading: boolean;
  hasFilters: boolean;
  onClearFilters: () => void;
  onView: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onStatus: (vendor: Vendor) => void;
  onResetPassword: (vendor: Vendor) => void;
}

function VendorStatus({ active }: { active: boolean }) {
  return <Badge className={active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>{active ? "Active" : "Inactive"}</Badge>;
}

function VendorActions({ vendor, onView, onEdit, onStatus, onResetPassword }: Omit<VendorTableProps, "vendors" | "loading" | "hasFilters" | "onClearFilters"> & { vendor: Vendor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${vendor.companyName}`}><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onView(vendor)}><UserRound />View Details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(vendor)}><Pencil />Edit Vendor</DropdownMenuItem>
        <DropdownMenuItem disabled={!vendor.isActive} onSelect={() => onResetPassword(vendor)}><KeyRound />Reset Password</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant={vendor.isActive ? "destructive" : "default"} onSelect={() => onStatus(vendor)}><Power />{vendor.isActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell><div className="flex items-center gap-3"><Skeleton className="size-9 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="ml-auto size-8" /></TableCell>
    </TableRow>
  ));
}

export function VendorTable(props: VendorTableProps) {
  const { vendors, loading, hasFilters, onClearFilters, onView, onEdit, onStatus, onResetPassword } = props;

  if (!loading && vendors.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">{hasFilters ? <Search className="size-5" /> : <Store className="size-5" />}</div>
        <h2 className="mt-4 font-semibold text-slate-950">{hasFilters ? "No vendors match your filters" : "No vendors yet"}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{hasFilters ? "Try a different search or status filter." : "Create your first vendor to give them access to work requests."}</p>
        {hasFilters ? <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>Clear filters</Button> : null}
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader><TableRow><TableHead className="pl-6">Vendor / Company</TableHead><TableHead>Category</TableHead><TableHead>Contact Person</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="w-16 pr-6 text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <LoadingRows /> : vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="pl-6"><div className="flex items-center gap-3"><Avatar className="size-9"><AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">{userInitials(vendor.companyName)}</AvatarFallback></Avatar><div className="min-w-0"><button type="button" onClick={() => onView(vendor)} className="max-w-52 truncate text-left text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline">{vendor.companyName}</button><p className="text-xs text-slate-500">{vendor.address ?? "Address not provided"}</p></div></div></TableCell>
                <TableCell className="whitespace-nowrap text-slate-600">{vendor.category ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-600">{vendor.contactPerson}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-600">{vendor.email}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-600">{vendor.phone}</TableCell>
                <TableCell><VendorStatus active={vendor.isActive} /></TableCell>
                <TableCell className="pr-6 text-right"><VendorActions vendor={vendor} onView={onView} onEdit={onEdit} onStatus={onStatus} onResetPassword={onResetPassword} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {loading ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-44 w-full rounded-xl" />) : vendors.map((vendor) => (
          <Card key={vendor.id} className="border-slate-200 shadow-none"><CardContent className="p-4"><div className="flex items-start gap-3"><Avatar><AvatarFallback className="bg-indigo-50 text-sm font-semibold text-indigo-700">{userInitials(vendor.companyName)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><button type="button" onClick={() => onView(vendor)} className="block max-w-full truncate text-left font-semibold text-slate-950 hover:text-indigo-600">{vendor.companyName}</button><p className="mt-0.5 text-sm text-slate-500">{vendor.category ?? "Uncategorized"}</p></div><VendorActions vendor={vendor} onView={onView} onEdit={onEdit} onStatus={onStatus} onResetPassword={onResetPassword} /></div><div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600"><p className="truncate">{vendor.contactPerson} · {vendor.email}</p><div className="flex items-center justify-between gap-3"><span>{vendor.phone}</span><VendorStatus active={vendor.isActive} /></div></div></CardContent></Card>
        ))}
      </div>
    </>
  );
}
