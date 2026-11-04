import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AuthBoundary } from "@/features/auth/components/auth-boundary";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <AuthBoundary role="VENDOR"><DashboardLayout role="VENDOR">{children}</DashboardLayout></AuthBoundary>;
}
