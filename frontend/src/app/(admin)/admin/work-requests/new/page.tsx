import { WorkRequestForm } from "@/features/work-requests/components/work-request-form";

export const instant = false;

export default function NewWorkRequestPage() {
  return <div className="space-y-6"><section><p className="text-sm font-medium text-indigo-600">Admin Portal</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Create Work Request</h1><p className="mt-2 text-sm text-slate-500">Build a clear event brief for vendors to quote.</p></section><WorkRequestForm /></div>;
}
