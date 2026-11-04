import { Banknote, CircleDollarSign, WalletCards } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { paymentProgress } from "../bookings.utils";
import type { PaymentSummary } from "../bookings.types";

export function FinancialSummary({ summary }: { summary: PaymentSummary }) {
  const progress = paymentProgress(summary.totalPaid, summary.bookingAmount);
  const cards = [
    { label: "Booking Amount", value: summary.bookingAmount, icon: WalletCards },
    { label: "Total Paid", value: summary.totalPaid, icon: CircleDollarSign },
    { label: "Pending Balance", value: summary.pendingAmount, icon: Banknote },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-slate-200 shadow-none">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{formatCurrency(value)}</p></div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="size-4.5" aria-hidden="true" /></span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">Payment progress</span><span className="text-slate-500">{progress.toFixed(progress % 1 === 0 ? 0 : 1)}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Payment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
