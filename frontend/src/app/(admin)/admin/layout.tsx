import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AuthBoundary } from "@/features/auth/components/auth-boundary";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthBoundary role="ADMIN"><DashboardLayout role="ADMIN">{children}</DashboardLayout></AuthBoundary>;
}
