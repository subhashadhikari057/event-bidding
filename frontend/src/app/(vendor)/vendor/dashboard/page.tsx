import { VendorDashboard } from "@/features/dashboard/vendor-dashboard";

// This page is intentionally withheld by AuthBoundary until the vendor session is verified.
export const instant = false;

export default function VendorDashboardPage() {
  return <VendorDashboard />;
}
