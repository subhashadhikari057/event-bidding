"use client";

import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
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
import { useDeleteWorkRequest } from "../work-requests.hooks";

interface DeleteWorkRequestDialogProps {
  request: { id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteWorkRequestDialog({ request, open, onOpenChange, onDeleted }: DeleteWorkRequestDialogProps) {
  const remove = useDeleteWorkRequest();

  const confirm = async () => {
    if (!request) return;
    try {
      await remove.mutateAsync(request.id);
      toast.success("Draft request deleted");
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      toast.error("Could not delete work request", { description: getErrorMessage(error) });
    }
  };

  return (
    <AlertDialog open={open && Boolean(request)} onOpenChange={(next) => !remove.isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-red-100 text-red-700"><AlertTriangle className="size-5" /></div>
          <AlertDialogTitle>Delete Draft Request?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-slate-700">{request?.title}</span> and its items and reference photos will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => { event.preventDefault(); void confirm(); }}
          >
            {remove.isPending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
            {remove.isPending ? "Deleting…" : "Delete Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
