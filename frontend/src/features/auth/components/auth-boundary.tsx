"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";
import type { UserRole } from "../auth.types";
import { useAuth } from "../use-auth";

export function AuthBoundary({ children, role }: { children: ReactNode; role: UserRole }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.unauthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (auth.user && auth.user.role !== role) {
      router.replace(auth.user.role === "ADMIN" ? "/admin/dashboard" : "/vendor/dashboard");
    }
  }, [auth.unauthenticated, auth.user, pathname, role, router]);

  if (auth.loading || auth.unauthenticated || (auth.user && auth.user.role !== role)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark compact />
          <div className="size-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-slate-500">Verifying your workspace…</p>
        </div>
      </div>
    );
  }

  if (auth.error || !auth.user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto size-8 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold text-slate-950">Unable to verify your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Check that the backend is running, then try again.</p>
          <Button className="mt-5" onClick={() => void auth.refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return children;
}
