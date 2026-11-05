import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image src="/logo.svg" width={42} height={42} alt={compact ? "Mero Event" : ""} className="size-10 shrink-0 rounded-full shadow-sm" />
      {compact ? null : (
        <span className="leading-none">
          <span className="block text-sm font-semibold tracking-tight text-slate-950">Mero Event</span>
          <span className="mt-1 block text-[11px] font-medium text-slate-500">Vendor bidding workspace</span>
        </span>
      )}
    </div>
  );
}
