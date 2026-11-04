import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { bookingsApi } from "./bookings.api";
import type { RecordPaymentInput } from "./bookings.types";

export const bookingKeys = {
  admin: ["admin", "bookings"] as const,
  adminDetail: (id: string) => ["admin", "bookings", id] as const,
  vendor: ["vendor", "bookings"] as const,
};

export function useBookings() {
  return useQuery({ queryKey: bookingKeys.admin, queryFn: ({ signal }) => bookingsApi.adminList(signal) });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.adminDetail(id),
    queryFn: ({ signal }) => bookingsApi.adminDetail(id, signal),
    enabled: Boolean(id),
  });
}

export function useVendorBookings() {
  return useQuery({ queryKey: bookingKeys.vendor, queryFn: ({ signal }) => bookingsApi.vendorList(signal) });
}

export function useRecordPayment(bookingId: string) {
  const client = useQueryClient();
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: bookingKeys.admin }),
    client.invalidateQueries({ queryKey: bookingKeys.adminDetail(bookingId) }),
    client.invalidateQueries({ queryKey: bookingKeys.vendor }),
  ]);

  return useMutation({
    mutationFn: (input: RecordPaymentInput) => bookingsApi.recordPayment(bookingId, input),
    onSuccess: refresh,
    onError: (error) => error instanceof ApiError && error.status === 409 ? refresh() : undefined,
  });
}
