import { api } from "@/lib/api-client";
import type { AcceptedBooking, BidComparison, SubmittedBid, VendorBid } from "./bids.types";

export const bidsApi = {
  submit: (workRequestId: string, input: { amount: string; notes?: string }) =>
    api.post<SubmittedBid>(`/vendor/requests/${workRequestId}/bid`, input),
  vendorBids: (signal?: AbortSignal) => api.get<VendorBid[]>("/vendor/bids", signal),
  compare: (workRequestId: string, signal?: AbortSignal) =>
    api.get<BidComparison>(`/work-requests/${workRequestId}/bids`, signal),
  accept: (bidId: string) => api.post<AcceptedBooking>(`/bids/${bidId}/accept`),
};
