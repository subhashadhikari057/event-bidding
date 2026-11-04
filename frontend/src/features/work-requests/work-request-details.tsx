"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ImagePlus, LoaderCircle, MapPin, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { InviteVendorsDialog } from "./components/invite-vendors-dialog";
import { InvitedVendorsTable } from "./components/invited-vendors-table";
import { RequestPhotoGallery } from "./components/request-photo-gallery";
import { RequestPhotoUpload } from "./components/request-photo-upload";
import { useUploadRequestPhotos, useWorkRequest } from "./work-requests.hooks";

export function WorkRequestDetails({ id }: { id: string }) {
  const router = useRouter();
  const detail = useWorkRequest(id);
  const upload = useUploadRequestPhotos();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  if (detail.isPending) return <div className="space-y-5"><div className="h-28 animate-pulse rounded-xl bg-slate-200" /><div className="h-64 animate-pulse rounded-xl bg-slate-200" /></div>;
  if (detail.isError) {
    const notFound = detail.error instanceof ApiError && detail.error.status === 404;
    return <Card className="border-slate-200 shadow-none"><CardContent className="flex min-h-72 flex-col items-center justify-center text-center"><h1 className="text-xl font-semibold text-slate-950">{notFound ? "Work request not found" : "Unable to load work request"}</h1><p className="mt-2 text-sm text-slate-500">{getErrorMessage(detail.error)}</p><div className="mt-5 flex gap-2"><Button variant="outline" onClick={() => router.push("/admin/work-requests")}><ArrowLeft />Back to requests</Button>{!notFound ? <Button onClick={() => void detail.refetch()}>Try again</Button> : null}</div></CardContent></Card>;
  }
  const request = detail.data;
  const canEdit = request.status === "DRAFT";
  const canInvite = request.status === "DRAFT" || request.status === "OPEN";

  const uploadFiles = async () => {
    if (!files.length) return;
    try { await upload.mutateAsync({ id, files }); setFiles([]); toast.success("Reference photos uploaded"); }
    catch (error) { toast.error("Could not upload photos", { description: getErrorMessage(error) }); }
  };

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" asChild><Link href="/admin/work-requests"><ArrowLeft />Back to Work Requests</Link></Button>
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">{request.title}</h1><StatusBadge status={request.status} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-4" />{formatDate(request.eventDate)}</span><span className="flex items-center gap-1.5"><MapPin className="size-4" />{request.eventLocation}</span><span>Created {formatDate(request.createdAt)}</span></div></div><div className="flex flex-wrap gap-2">{canEdit ? <Button variant="outline" asChild><Link href={`/admin/work-requests/${id}/edit`}><Pencil />Edit Request</Link></Button> : null}{canInvite ? <Button onClick={() => setInviteOpen(true)}><Send />Invite Vendors</Button> : null}</div></section>

    {request.status === "BOOKED" ? <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><BriefcaseBusiness className="mt-0.5 size-5" /><div><p className="font-semibold">This request has been booked</p><p className="mt-1 text-sm">The accepted vendor and payment details will be available in the Bookings module.</p></div></div> : null}

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Event Overview</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.description}</p></CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Required Items</CardTitle><CardDescription>{request.items.length} item{request.items.length === 1 ? "" : "s"} included in this request.</CardDescription></CardHeader><CardContent className="px-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Item</TableHead><TableHead>Description</TableHead><TableHead>Quantity</TableHead><TableHead className="pr-6">Unit</TableHead></TableRow></TableHeader><TableBody>{request.items.map((item) => <TableRow key={item.id}><TableCell className="pl-6 font-medium text-slate-900">{item.name}</TableCell><TableCell className="max-w-md text-slate-600">{item.description ?? "—"}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="pr-6 text-slate-600">{item.unit ?? "—"}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Invited Vendors</CardTitle><CardDescription>Vendors assigned to review this request. Bid amounts are not shown here.</CardDescription></CardHeader><CardContent><InvitedVendorsTable requestId={id} /></CardContent></Card>
      </div>
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Reference Photos</CardTitle><CardDescription>{request.photos.length} of 5 uploaded.</CardDescription></CardHeader><CardContent className="space-y-4"><RequestPhotoGallery photos={request.photos} />{canEdit && request.photos.length < 5 ? <div className="border-t border-slate-200 pt-4"><RequestPhotoUpload files={files} onChange={setFiles} existingCount={request.photos.length} disabled={upload.isPending} />{files.length ? <Button className="mt-3 w-full" onClick={() => void uploadFiles()} disabled={upload.isPending}>{upload.isPending ? <LoaderCircle className="animate-spin" /> : <ImagePlus />}{upload.isPending ? "Uploading…" : `Upload ${files.length} photo${files.length === 1 ? "" : "s"}`}</Button> : null}</div> : null}</CardContent></Card>
        <Card className="border-slate-200 shadow-none"><CardHeader><CardTitle className="text-lg">Submitted Bids</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-500">Compare submitted quotations without exposing competitor pricing to vendors.</p><Button asChild variant="outline" className="mt-4 w-full"><Link href={`/admin/work-requests/${id}/bids`}>Compare Vendor Quotations</Link></Button></CardContent></Card>
      </div>
    </div>
    {canInvite ? <InviteVendorsDialog requestId={id} requestTitle={request.title} open={inviteOpen} onOpenChange={setInviteOpen} /> : null}
  </div>;
}
