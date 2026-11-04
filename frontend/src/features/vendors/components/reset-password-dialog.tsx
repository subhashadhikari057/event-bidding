"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, LoaderCircle, ShieldAlert } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api-client";
import { vendorsApi } from "../vendors.api";
import type { ResetVendorPasswordResponse, Vendor } from "../vendors.types";

export function ResetPasswordDialog({ vendor, open, onOpenChange }: { vendor: Vendor | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ResetVendorPasswordResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!vendor) return null;

  const close = () => {
    setResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  const resetPassword = async () => {
    setPending(true);
    try {
      const response = await vendorsApi.resetPassword(vendor.id);
      setResult(response);
    } catch (error) {
      toast.error("Could not reset password", { description: getErrorMessage(error) });
    } finally {
      setPending(false);
    }
  };

  const copyPassword = async () => {
    if (!result?.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      toast.success("Password copied");
    } catch {
      toast.error("Could not copy password", { description: "Select and copy the password manually." });
    }
  };

  return (
    <>
      <AlertDialog open={open && !result} onOpenChange={(next) => !pending && !next && close()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><ShieldAlert className="size-5" /></div>
            <AlertDialogTitle>Reset Vendor Password?</AlertDialogTitle>
            <AlertDialogDescription>The existing password will immediately stop working. Only reset it after verifying the vendor&apos;s identity.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="font-medium text-slate-900">{vendor.companyName}</p>
            <p className="mt-1 text-sm text-slate-500">{vendor.email}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void resetPassword(); }} disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : <KeyRound />}
              {pending ? "Resetting…" : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open && Boolean(result)} onOpenChange={(next) => !next && close()}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="size-5" /></div>
            <DialogTitle>Password Reset Complete</DialogTitle>
            <DialogDescription>{result?.message}</DialogDescription>
          </DialogHeader>
          {result?.temporaryPassword ? (
            <div className="space-y-3">
              <div><p className="text-sm font-medium text-slate-900">{vendor.companyName}</p><p className="text-sm text-slate-500">{vendor.email}</p></div>
              <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <code className="min-w-0 flex-1 select-all break-all text-sm font-semibold text-indigo-950">{result.temporaryPassword}</code>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyPassword()}>
                  {copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy Password"}
                </Button>
              </div>
              <p className="text-xs leading-5 text-amber-700">This temporary password is displayed only once. Share it privately with the verified vendor, then close this dialog.</p>
            </div>
          ) : null}
          <DialogFooter><Button onClick={close}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
