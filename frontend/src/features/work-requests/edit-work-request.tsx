"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError, getErrorMessage } from "@/lib/api-client";
import { WorkRequestForm } from "./components/work-request-form";
import { useWorkRequest } from "./work-requests.hooks";

export function EditWorkRequest({ id }: { id: string }) {
  const detail = useWorkRequest(id);
  if (detail.isPending) return <div className="space-y-5"><div className="h-20 animate-pulse rounded-xl bg-slate-200" /><div className="h-72 animate-pulse rounded-xl bg-slate-200" /></div>;
  if (detail.isError) { const notFound = detail.error instanceof ApiError && detail.error.status === 404; return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold">{notFound ? "Work request not found" : "Unable to load request"}</h1><p className="mt-2 text-sm text-slate-500">{getErrorMessage(detail.error)}</p><Button asChild variant="outline" className="mt-5"><Link href="/admin/work-requests">Back to requests</Link></Button></CardContent></Card>; }
  if (detail.data.status !== "DRAFT") return <Card><CardContent className="py-16 text-center"><h1 className="text-xl font-semibold">This request can no longer be edited</h1><p className="mt-2 text-sm text-slate-500">Only DRAFT work requests can be modified.</p><Button asChild className="mt-5"><Link href={`/admin/work-requests/${id}`}>View request</Link></Button></CardContent></Card>;
  return <div className="space-y-6"><Button variant="ghost" size="sm" asChild><Link href={`/admin/work-requests/${id}`}><ArrowLeft />Back to request</Link></Button><section><p className="text-sm font-medium text-indigo-600">Admin Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Edit Work Request</h1><p className="mt-2 text-sm text-slate-500">Update event details and replace the required item list.</p></section><WorkRequestForm request={detail.data} /></div>;
}
