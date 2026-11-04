import { VendorBookingDetails } from "@/features/bookings/vendor-booking-details";

export const instant = false;

export default async function VendorBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VendorBookingDetails id={id} />;
}
