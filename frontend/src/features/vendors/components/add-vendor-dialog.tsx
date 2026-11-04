"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { useCreateVendor } from "../vendors.hooks";
import {
  createVendorSchema,
  optionalValue,
  vendorCategories,
  type CreateVendorValues,
} from "../vendors.schema";

const emptyValues: CreateVendorValues = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  category: "",
  password: "",
  confirmPassword: "",
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-red-600" role="alert">{message}</p> : null;
}

export function AddVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const createVendor = useCreateVendor();
  const form = useForm<CreateVendorValues>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: emptyValues,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !createVendor.isPending) {
      form.reset(emptyValues);
      setShowPassword(false);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createVendor.mutateAsync({
        companyName: values.companyName.trim(),
        contactPerson: values.contactPerson.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: optionalValue(values.address),
        category: optionalValue(values.category),
        password: values.password,
      });
      toast.success("Vendor created", { description: `${values.companyName.trim()} can now access Mero Event.` });
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", { message: error.message });
        return;
      }
      toast.error("Could not create vendor", { description: getErrorMessage(error) });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Create a vendor company and its login account.</DialogDescription>
        </DialogHeader>
        <form id="add-vendor-form" onSubmit={onSubmit} className="space-y-6" noValidate>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-slate-900">Company Information</legend>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-company">Company Name <span className="text-red-600">*</span></Label>
              <Input id="add-company" autoFocus aria-invalid={Boolean(errors.companyName)} {...form.register("companyName")} />
              <FieldError message={errors.companyName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-category">Service Category</Label>
              <Controller control={form.control} name="category" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="add-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>{vendorCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              <FieldError message={errors.category?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Input id="add-address" placeholder="Kathmandu" aria-invalid={Boolean(errors.address)} {...form.register("address")} />
              <FieldError message={errors.address?.message} />
            </div>
          </fieldset>

          <fieldset className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-slate-900">Contact Information</legend>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="add-contact">Contact Person <span className="text-red-600">*</span></Label>
              <Input id="add-contact" aria-invalid={Boolean(errors.contactPerson)} {...form.register("contactPerson")} />
              <FieldError message={errors.contactPerson?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address <span className="text-red-600">*</span></Label>
              <Input id="add-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number <span className="text-red-600">*</span></Label>
              <Input id="add-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} {...form.register("phone")} />
              <FieldError message={errors.phone?.message} />
            </div>
          </fieldset>

          <fieldset className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-semibold text-slate-900">Account Credentials</legend>
            {(["password", "confirmPassword"] as const).map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`add-${field}`}>{field === "password" ? "Initial Password" : "Confirm Password"} <span className="text-red-600">*</span></Label>
                <div className="relative">
                  <Input id={`add-${field}`} type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-10" aria-invalid={Boolean(errors[field])} {...form.register(field)} />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError message={errors[field]?.message} />
              </div>
            ))}
            <p className="text-xs text-slate-500 sm:col-span-2">Use 6–72 UTF-8 bytes. Share the initial password privately with the vendor.</p>
          </fieldset>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={createVendor.isPending} onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="add-vendor-form" disabled={createVendor.isPending}>
            {createVendor.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {createVendor.isPending ? "Creating…" : "Create Vendor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
