import { VendorRequestDetails } from "@/features/work-requests/vendor-request-details";

export const instant = false;

export default async function AssignedRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VendorRequestDetails id={id} />;
}
