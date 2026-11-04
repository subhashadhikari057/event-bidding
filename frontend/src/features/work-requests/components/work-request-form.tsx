"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, ClipboardList, ImagePlus, LoaderCircle, MapPin, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-client";
import { RequestPhotoUpload } from "./request-photo-upload";
import { useCreateWorkRequest, useUpdateWorkRequest, useUploadRequestPhotos } from "../work-requests.hooks";
import { optionalField, toNepalDateTimeInput, toNepalIso, workRequestSchema, type WorkRequestFormValues } from "../work-requests.schema";
import type { WorkRequest, WorkRequestInput } from "../work-requests.types";

const emptyValues: WorkRequestFormValues = { title: "", description: "", eventDate: "", eventLocation: "", items: [{ name: "", description: "", quantity: 1, unit: "" }] };

function FieldError({ message }: { message?: string }) { return message ? <p className="text-xs text-red-600" role="alert">{message}</p> : null; }

function initialValues(request?: WorkRequest): WorkRequestFormValues {
  if (!request) return emptyValues;
  return { title: request.title, description: request.description, eventDate: toNepalDateTimeInput(request.eventDate), eventLocation: request.eventLocation, items: request.items.map((item) => ({ name: item.name, description: item.description ?? "", quantity: item.quantity, unit: item.unit ?? "" })) };
}

export function WorkRequestForm({ request }: { request?: WorkRequest }) {
  const editing = Boolean(request);
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const createRequest = useCreateWorkRequest();
  const updateRequest = useUpdateWorkRequest();
  const uploadPhotos = useUploadRequestPhotos();
  const form = useForm<WorkRequestFormValues>({ resolver: zodResolver(workRequestSchema), defaultValues: initialValues(request) });
  const items = useFieldArray({ control: form.control, name: "items" });
  const pending = createRequest.isPending || updateRequest.isPending || uploadPhotos.isPending;

  const submit = form.handleSubmit(async (values) => {
    const input: WorkRequestInput = { title: values.title.trim(), description: values.description.trim(), eventDate: toNepalIso(values.eventDate), eventLocation: values.eventLocation.trim(), items: values.items.map((item) => ({ name: item.name.trim(), description: optionalField(item.description), quantity: item.quantity, unit: optionalField(item.unit) })) };
    try {
      if (request) {
        await updateRequest.mutateAsync({ id: request.id, input });
        toast.success("Work request updated");
        router.push(`/admin/work-requests/${request.id}`);
        return;
      }
      const created = await createRequest.mutateAsync(input);
      if (photos.length) {
        try { await uploadPhotos.mutateAsync({ id: created.id, files: photos }); }
        catch (error) { toast.warning("Request created, but photos were not uploaded", { description: `${getErrorMessage(error)} You can retry from the request details page.` }); router.push(`/admin/work-requests/${created.id}`); return; }
      }
      toast.success("Work request created", { description: "The request is saved as a draft." });
      router.push(`/admin/work-requests/${created.id}`);
    } catch (error) { toast.error(editing ? "Could not update work request" : "Could not create work request", { description: getErrorMessage(error) }); }
  });

  const errors = form.formState.errors;
  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="size-5 text-indigo-600" />Event Details</CardTitle><CardDescription>Core event information vendors need to prepare a quotation.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="request-title">Work Request Title <span className="text-red-600">*</span></Label><Input id="request-title" autoFocus aria-invalid={Boolean(errors.title)} {...form.register("title")} /><FieldError message={errors.title?.message} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="request-description">Description <span className="text-red-600">*</span></Label><Textarea id="request-description" rows={5} aria-invalid={Boolean(errors.description)} {...form.register("description")} /><FieldError message={errors.description?.message} /></div>
        <div className="space-y-2"><Label htmlFor="event-date">Event Date & Time <span className="text-red-600">*</span></Label><Input id="event-date" type="datetime-local" aria-invalid={Boolean(errors.eventDate)} {...form.register("eventDate")} /><FieldError message={errors.eventDate?.message} /><p className="text-xs text-slate-500">Nepal time (UTC+05:45)</p></div>
        <div className="space-y-2"><Label htmlFor="event-location">Event Location <span className="text-red-600">*</span></Label><div className="relative"><MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="event-location" className="pl-9" aria-invalid={Boolean(errors.eventLocation)} {...form.register("eventLocation")} /></div><FieldError message={errors.eventLocation?.message} /></div>
      </CardContent></Card>

      <Card className="border-slate-200 shadow-none"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-lg"><ClipboardList className="size-5 text-indigo-600" />Required Items</CardTitle><CardDescription className="mt-1">Add each product or service the vendor should quote.</CardDescription></div><Button type="button" variant="outline" size="sm" onClick={() => items.append({ name: "", description: "", quantity: 1, unit: "" })}><Plus />Add Item</Button></CardHeader><CardContent className="space-y-4">
        {items.fields.map((field, index) => <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Item {index + 1}</p><Button type="button" variant="ghost" size="icon-sm" disabled={items.fields.length === 1} onClick={() => items.remove(index)} aria-label={`Remove item ${index + 1}`}><Trash2 className="text-red-600" /></Button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label htmlFor={`item-${index}-name`}>Item Name <span className="text-red-600">*</span></Label><Input id={`item-${index}-name`} aria-invalid={Boolean(errors.items?.[index]?.name)} {...form.register(`items.${index}.name`)} /><FieldError message={errors.items?.[index]?.name?.message} /></div>
          <div className="space-y-2"><Label htmlFor={`item-${index}-quantity`}>Quantity <span className="text-red-600">*</span></Label><Input id={`item-${index}-quantity`} type="number" min={1} aria-invalid={Boolean(errors.items?.[index]?.quantity)} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /><FieldError message={errors.items?.[index]?.quantity?.message} /></div>
          <div className="space-y-2"><Label htmlFor={`item-${index}-unit`}>Unit</Label><Input id={`item-${index}-unit`} placeholder="set" {...form.register(`items.${index}.unit`)} /><FieldError message={errors.items?.[index]?.unit?.message} /></div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-6"><Label htmlFor={`item-${index}-description`}>Description</Label><Input id={`item-${index}-description`} placeholder="Specifications or quality expectations" {...form.register(`items.${index}.description`)} /><FieldError message={errors.items?.[index]?.description?.message} /></div>
        </div></div>)}
        <FieldError message={errors.items?.root?.message ?? errors.items?.message} />
      </CardContent></Card>

      {!editing ? <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ImagePlus className="size-5 text-indigo-600" />Reference Photos</CardTitle><CardDescription>Optional visual references. Photos upload after the draft is created.</CardDescription></CardHeader><CardContent><RequestPhotoUpload files={photos} onChange={setPhotos} disabled={pending} /></CardContent></Card> : null}

      <Card className="border-indigo-100 bg-indigo-50/50 shadow-none"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-950">{editing ? "Ready to save changes?" : "Ready to create this request?"}</p><p className="mt-1 text-sm text-slate-600">{editing ? "Only draft requests can be updated." : `${items.fields.length} required item${items.fields.length === 1 ? "" : "s"} · saved initially as DRAFT`}</p></div><div className="flex gap-2"><Button type="button" variant="outline" asChild><Link href={request ? `/admin/work-requests/${request.id}` : "/admin/work-requests"}>Cancel</Link></Button><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? (uploadPhotos.isPending ? "Uploading photos…" : "Saving…") : editing ? "Save Changes" : "Create Work Request"}</Button></div></CardContent></Card>
    </form>
  );
}
