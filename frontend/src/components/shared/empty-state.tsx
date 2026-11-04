import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
