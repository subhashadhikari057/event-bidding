import { api } from "@/lib/api-client";
import type { AdminBooking, RecordPaymentInput, RecordPaymentResponse, VendorBooking } from "./bookings.types";

export const bookingsApi = {
  adminList: (signal?: AbortSignal) => api.get<AdminBooking[]>("/bookings", signal),
  adminDetail: (id: string, signal?: AbortSignal) => api.get<AdminBooking>(`/bookings/${id}`, signal),
  recordPayment: (id: string, input: RecordPaymentInput) =>
    api.post<RecordPaymentResponse>(`/bookings/${id}/payments`, input),
  vendorList: (signal?: AbortSignal) => api.get<VendorBooking[]>("/vendor/bookings", signal),
};
