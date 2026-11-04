"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 5 * 1024 * 1024;

function PhotoPreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={`Preview of ${file.name}`} className="aspect-square w-full object-cover" />;
}

export function RequestPhotoUpload({ files, onChange, existingCount = 0, disabled = false }: { files: File[]; onChange: (files: File[]) => void; existingCount?: number; disabled?: boolean }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    setError(null);
    const invalidType = incoming.find((file) => !acceptedTypes.has(file.type));
    if (invalidType) { setError("Only JPEG, PNG and WebP images are allowed."); return; }
    const tooLarge = incoming.find((file) => file.size > maxBytes);
    if (tooLarge) { setError(`${tooLarge.name} is larger than 5 MB.`); return; }
    if (existingCount + files.length + incoming.length > 5) { setError(`You can add ${Math.max(0, 5 - existingCount)} more photo${5 - existingCount === 1 ? "" : "s"}.`); return; }
    onChange([...files, ...incoming]);
  };

  const remove = (file: File) => {
    onChange(files.filter((item) => item !== file));
    setError(null);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={disabled || existingCount + files.length >= 5}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
        className={cn("flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-60", dragging && "border-indigo-500 bg-indigo-50")}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><UploadCloud className="size-5" /></div>
        <span className="mt-3 text-sm font-semibold text-slate-900">Drop photos here or click to browse</span>
        <span className="mt-1 text-xs text-slate-500">JPEG, PNG or WebP · up to 5 MB each · 5 total</span>
      </button>
      <input ref={inputRef} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      {files.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {files.map((file) => (
            <div key={`${file.name}-${file.lastModified}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white">
              <PhotoPreview file={file} />
              <Button type="button" variant="destructive" size="icon-sm" className="absolute right-1.5 top-1.5" onClick={() => remove(file)} aria-label={`Remove ${file.name}`}><Trash2 /></Button>
              <p className="truncate px-2 py-1.5 text-[11px] text-slate-600">{file.name}</p>
            </div>
          ))}
        </div>
      ) : existingCount >= 5 ? <p className="flex items-center gap-2 text-sm text-slate-500"><ImagePlus className="size-4" />This request already has the maximum of 5 photos.</p> : null}
    </div>
  );
}
