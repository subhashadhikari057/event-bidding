import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <CalendarDays className="size-4.5" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="leading-none">
          <span className="block text-sm font-semibold tracking-tight text-slate-950">Mero Event</span>
          <span className="mt-1 block text-[11px] font-medium text-slate-500">Vendor workspace</span>
        </span>
      )}
    </div>
  );
}
