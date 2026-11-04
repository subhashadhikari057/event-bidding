import { EditWorkRequest } from "@/features/work-requests/edit-work-request";

export const instant = false;

export default async function EditWorkRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditWorkRequest id={id} />;
}
