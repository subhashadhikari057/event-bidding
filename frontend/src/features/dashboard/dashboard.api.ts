import { api } from "@/lib/api-client";
import type {
  AdminBooking,
  AdminBidSummary,
  AssignedRequest,
  VendorBid,
  VendorBooking,
  VendorSummary,
  WorkRequestSummary,
} from "./dashboard.types";

export const dashboardApi = {
  admin: {
    vendors: (signal?: AbortSignal) => api.get<VendorSummary[]>("/vendors", signal),
    workRequests: (signal?: AbortSignal) => api.get<WorkRequestSummary[]>("/work-requests", signal),
    bidSummary: (signal?: AbortSignal) => api.get<AdminBidSummary>("/bids/summary", signal),
    bookings: (signal?: AbortSignal) => api.get<AdminBooking[]>("/bookings", signal),
  },
  vendor: {
    requests: (signal?: AbortSignal) => api.get<AssignedRequest[]>("/vendor/requests", signal),
    bids: (signal?: AbortSignal) => api.get<VendorBid[]>("/vendor/bids", signal),
    bookings: (signal?: AbortSignal) => api.get<VendorBooking[]>("/vendor/bookings", signal),
  },
};
