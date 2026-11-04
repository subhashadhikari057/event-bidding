import { AdminBookingDetails } from "@/features/bookings/admin-booking-details";

export const instant = false;

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBookingDetails id={id} />;
}
