import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workRequestKeys } from "@/features/work-requests/work-requests.hooks";
import { bidsApi } from "./bids.api";

export const bidKeys = {
  vendor: ["vendor", "bids"] as const,
  comparison: (workRequestId: string) => ["admin", "work-requests", workRequestId, "bids"] as const,
};

export function useVendorBids() {
  return useQuery({ queryKey: bidKeys.vendor, queryFn: ({ signal }) => bidsApi.vendorBids(signal) });
}

export function useSubmitBid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ workRequestId, amount, notes }: { workRequestId: string; amount: string; notes?: string }) => bidsApi.submit(workRequestId, { amount, notes }),
    onSuccess: (_data, variables) => Promise.all([
      client.invalidateQueries({ queryKey: bidKeys.vendor }),
      client.invalidateQueries({ queryKey: workRequestKeys.vendor }),
      client.invalidateQueries({ queryKey: workRequestKeys.vendorDetail(variables.workRequestId) }),
    ]),
  });
}

export function useWorkRequestBids(workRequestId: string) {
  return useQuery({ queryKey: bidKeys.comparison(workRequestId), queryFn: ({ signal }) => bidsApi.compare(workRequestId, signal), enabled: Boolean(workRequestId) });
}

export function useAcceptBid() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ bidId }: { bidId: string; workRequestId: string }) => bidsApi.accept(bidId),
    onSuccess: (_data, variables) => Promise.all([
      client.invalidateQueries({ queryKey: bidKeys.comparison(variables.workRequestId) }),
      client.invalidateQueries({ queryKey: ["admin", "bids", "summary"] }),
      client.invalidateQueries({ queryKey: workRequestKeys.admin }),
      client.invalidateQueries({ queryKey: ["admin", "bookings"] }),
      client.invalidateQueries({ queryKey: ["vendor"] }),
    ]),
  });
}
