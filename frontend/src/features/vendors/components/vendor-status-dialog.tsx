"use client";

import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getErrorMessage } from "@/lib/api-client";
import { useUpdateVendorStatus } from "../vendors.hooks";
import type { Vendor } from "../vendors.types";

export function VendorStatusDialog({ vendor, open, onOpenChange }: { vendor: Vendor | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateStatus = useUpdateVendorStatus();
  if (!vendor) return null;

  const nextActive = !vendor.isActive;
  const action = nextActive ? "Activate" : "Deactivate";

  const submit = async () => {
    try {
      await updateStatus.mutateAsync({ id: vendor.id, isActive: nextActive });
      toast.success(`Vendor ${nextActive ? "activated" : "deactivated"}`, {
        description: nextActive ? `${vendor.companyName} can access their account again.` : `${vendor.companyName} can no longer sign in.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(`Could not ${action.toLowerCase()} vendor`, { description: getErrorMessage(error) });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !updateStatus.isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{action} Vendor?</AlertDialogTitle>
          <AlertDialogDescription>
            {nextActive
              ? "This vendor will regain access to their account."
              : "This vendor will no longer be able to log in or access assigned work requests."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="font-medium text-slate-900">{vendor.companyName}</p>
          <p className="mt-1 text-sm text-slate-500">{vendor.email}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateStatus.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => { event.preventDefault(); void submit(); }}
            disabled={updateStatus.isPending}
            className={nextActive ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"}
          >
            {updateStatus.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {updateStatus.isPending ? `${action}ing…` : `${action} Vendor`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
