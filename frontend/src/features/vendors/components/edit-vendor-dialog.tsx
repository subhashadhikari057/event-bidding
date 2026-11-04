"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { useUpdateVendor } from "../vendors.hooks";
import { vendorCategories, vendorProfileSchema, type VendorProfileValues } from "../vendors.schema";
import type { UpdateVendorInput, Vendor } from "../vendors.types";

function valuesFor(vendor: Vendor): VendorProfileValues {
  return {
    companyName: vendor.companyName,
    contactPerson: vendor.contactPerson,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address ?? "",
    category: vendor.category ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-red-600" role="alert">{message}</p> : null;
}

export function EditVendorDialog({ vendor, open, onOpenChange }: { vendor: Vendor | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateVendor = useUpdateVendor();
  const form = useForm<VendorProfileValues>({ resolver: zodResolver(vendorProfileSchema) });

  useEffect(() => {
    if (vendor && open) form.reset(valuesFor(vendor));
  }, [form, open, vendor]);

  if (!vendor) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    const dirty = form.formState.dirtyFields;
    if ((dirty.address && !values.address.trim() && vendor.address) || (dirty.category && !values.category.trim() && vendor.category)) {
      if (dirty.address && !values.address.trim() && vendor.address) form.setError("address", { message: "The current API does not support clearing this field" });
      if (dirty.category && !values.category.trim() && vendor.category) form.setError("category", { message: "The current API does not support clearing this field" });
      return;
    }

    const input: UpdateVendorInput = {};
    if (dirty.companyName) input.companyName = values.companyName.trim();
    if (dirty.contactPerson) input.contactPerson = values.contactPerson.trim();
    if (dirty.email) input.email = values.email.trim();
    if (dirty.phone) input.phone = values.phone.trim();
    if (dirty.address && values.address.trim()) input.address = values.address.trim();
    if (dirty.category && values.category.trim()) input.category = values.category.trim();

    try {
      await updateVendor.mutateAsync({ id: vendor.id, input });
      toast.success("Vendor updated", { description: `${values.companyName.trim()}'s information is up to date.` });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("email", { message: error.message });
        return;
      }
      toast.error("Could not update vendor", { description: getErrorMessage(error) });
    }
  });

  const errors = form.formState.errors;
  const fields = [
    { name: "companyName" as const, label: "Company Name", type: "text" },
    { name: "contactPerson" as const, label: "Contact Person", type: "text" },
    { name: "email" as const, label: "Email Address", type: "email" },
    { name: "phone" as const, label: "Phone Number", type: "tel" },
    { name: "address" as const, label: "Address", type: "text" },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !updateVendor.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Edit Vendor</DialogTitle><DialogDescription>Update the vendor&apos;s company and contact information.</DialogDescription></DialogHeader>
        <form id="edit-vendor-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          {fields.map((field, index) => (
            <div key={field.name} className={index === 0 ? "space-y-2 sm:col-span-2" : "space-y-2"}>
              <Label htmlFor={`edit-${field.name}`}>{field.label} {field.name !== "address" ? <span className="text-red-600">*</span> : null}</Label>
              <Input id={`edit-${field.name}`} type={field.type} autoFocus={index === 0} aria-invalid={Boolean(errors[field.name])} {...form.register(field.name)} />
              <FieldError message={errors[field.name]?.message} />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="edit-category">Service Category</Label>
            <Controller control={form.control} name="category" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="edit-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{vendorCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            <FieldError message={errors.category?.message} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={updateVendor.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="edit-vendor-form" disabled={updateVendor.isPending || !form.formState.isDirty}>
            {updateVendor.isPending ? <LoaderCircle className="animate-spin" /> : null}
            {updateVendor.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
