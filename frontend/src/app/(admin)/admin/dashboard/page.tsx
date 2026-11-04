import { AdminDashboard } from "@/features/dashboard/admin-dashboard";

// This page is intentionally withheld by AuthBoundary until the admin session is verified.
export const instant = false;

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
