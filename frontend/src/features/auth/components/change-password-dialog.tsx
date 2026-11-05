"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, AUTH_UNAUTHORIZED_EVENT, getErrorMessage } from "@/lib/api-client";
import { authApi } from "../auth.api";

const passwordBytes = (value: string) => new TextEncoder().encode(value).length;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(72, "Current password must be 72 characters or fewer"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(72, "New password must be 72 characters or fewer")
    .refine((value) => passwordBytes(value) >= 6 && passwordBytes(value) <= 72, "New password must contain between 6 and 72 UTF-8 bytes"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).superRefine((value, context) => {
  if (value.newPassword === value.currentPassword) context.addIssue({ code: "custom", path: ["newPassword"], message: "New password must be different from the current password" });
  if (value.newPassword !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function PasswordField({ id, label, visible, error, registration, onToggle }: { id: string; label: string; visible: boolean; error?: string; registration: ReturnType<ReturnType<typeof useForm<ChangePasswordFormValues>>["register"]>; onToggle: () => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} autoComplete={id === "current-password" ? "current-password" : "new-password"} className="h-11 pr-10" aria-invalid={Boolean(error)} {...registration} />
        <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}

export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [visibleField, setVisibleField] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });
  const changePassword = useMutation({ mutationFn: authApi.changePassword });

  const close = () => {
    if (changePassword.isPending) return;
    form.reset();
    changePassword.reset();
    setVisibleField(null);
    onOpenChange(false);
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const response = await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      form.reset();
      queryClient.clear();
      onOpenChange(false);
      toast.success("Password changed", { description: response.message });
      router.replace("/login");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && error.message !== "Current password is incorrect" && typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
    }
  });

  const toggle = (field: string) => setVisibleField((current) => current === field ? null : field);
  const requestError = changePassword.error ? getErrorMessage(changePassword.error) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><ShieldCheck className="size-5" aria-hidden="true" /></div>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Choose a new password for your Mero Event account. You will need to sign in again afterward.</DialogDescription>
        </DialogHeader>
        <form id="change-password-form" className="space-y-4" onSubmit={submit} noValidate>
          <PasswordField id="current-password" label="Current password" visible={visibleField === "current"} error={form.formState.errors.currentPassword?.message} registration={form.register("currentPassword")} onToggle={() => toggle("current")} />
          <PasswordField id="new-password" label="New password" visible={visibleField === "new"} error={form.formState.errors.newPassword?.message} registration={form.register("newPassword")} onToggle={() => toggle("new")} />
          <PasswordField id="confirm-password" label="Confirm new password" visible={visibleField === "confirm"} error={form.formState.errors.confirmPassword?.message} registration={form.register("confirmPassword")} onToggle={() => toggle("confirm")} />
          <p className="text-xs leading-5 text-slate-500">Use between 6 and 72 characters. Your new password must be different from your current password.</p>
          {requestError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{requestError}</div> : null}
        </form>
        <DialogFooter><Button type="button" variant="outline" disabled={changePassword.isPending} onClick={close}>Cancel</Button><Button type="submit" form="change-password-form" disabled={changePassword.isPending}>{changePassword.isPending ? <LoaderCircle className="animate-spin" /> : <KeyRound />}{changePassword.isPending ? "Changing…" : "Change Password"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
