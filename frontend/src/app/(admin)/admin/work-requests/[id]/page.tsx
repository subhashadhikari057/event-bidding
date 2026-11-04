import { WorkRequestDetails } from "@/features/work-requests/work-request-details";

export const instant = false;

export default async function WorkRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkRequestDetails id={id} />;
}
