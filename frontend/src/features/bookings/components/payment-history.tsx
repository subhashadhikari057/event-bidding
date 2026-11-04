import { ReceiptText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BookingPayment } from "../bookings.types";

const methodLabels: Record<BookingPayment["method"], string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  OTHER: "Other",
};

export function PaymentHistory({ payments }: { payments: BookingPayment[] }) {
  const sorted = [...payments].sort((left, right) => new Date(right.paidAt).getTime() - new Date(left.paidAt).getTime());
  return (
    <Card className="overflow-hidden border-slate-200 shadow-none">
      <CardHeader><CardTitle className="text-lg">Payment History</CardTitle><CardDescription>Externally completed payments recorded against this booking.</CardDescription></CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? <EmptyState icon={ReceiptText} title="No payments recorded" description="No payments have been recorded for this booking yet." /> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="pl-6">Payment Date</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Transaction Reference</TableHead><TableHead className="pr-6">Notes</TableHead></TableRow></TableHeader><TableBody>
            {sorted.map((payment) => <TableRow key={payment.id}><TableCell className="whitespace-nowrap pl-6 text-slate-600">{formatDate(payment.paidAt)}</TableCell><TableCell className="whitespace-nowrap font-semibold text-slate-950">{formatCurrency(payment.amount)}</TableCell><TableCell className="whitespace-nowrap text-slate-600">{methodLabels[payment.method]}</TableCell><TableCell className="max-w-48 truncate text-slate-600">{payment.reference ?? "—"}</TableCell><TableCell className="max-w-64 truncate pr-6 text-slate-600">{payment.notes ?? "—"}</TableCell></TableRow>)}
          </TableBody></Table></div>
        )}
      </CardContent>
    </Card>
  );
}
