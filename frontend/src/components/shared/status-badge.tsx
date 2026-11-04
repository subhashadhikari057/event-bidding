import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  OPEN: "border-indigo-200 bg-indigo-50 text-indigo-700",
  BOOKED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  RESPONDED: "border-blue-200 bg-blue-50 text-blue-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CONFIRMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UNPAID: "border-slate-200 bg-slate-100 text-slate-700",
  PARTIALLY_PAID: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status] ?? styles.DRAFT, className)}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
