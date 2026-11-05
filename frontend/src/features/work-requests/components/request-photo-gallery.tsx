"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getMediaUrl } from "@/lib/media-url";
import type { RequestPhoto } from "../work-requests.types";

export function RequestPhotoGallery({ photos }: { photos: RequestPhoto[] }) {
  const [selected, setSelected] = useState<RequestPhoto | null>(null);
  if (!photos.length) return <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"><ImageIcon className="size-6 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">No reference photos</p><p className="mt-1 text-xs text-slate-500">Photos added to this request will appear here.</p></div>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setSelected(photo)} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getMediaUrl(photo.imageUrl)} alt={`Reference photo ${index + 1}`} className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.02]" />
        </button>)}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Reference Photo</DialogTitle><DialogDescription>Full-size event requirement reference.</DialogDescription></DialogHeader>
          {selected ? <div className="overflow-hidden rounded-lg bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getMediaUrl(selected.imageUrl)} alt="Selected work request reference" className="max-h-[70svh] w-full object-contain" />
          </div> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
