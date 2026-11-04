import { VendorManagement } from "@/features/vendors/vendor-management";

// The admin layout intentionally withholds this page until the session is verified.
export const instant = false;

export default function VendorsPage() {
  return <VendorManagement />;
}
