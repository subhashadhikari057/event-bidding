import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vendorsApi } from "./vendors.api";
import type { CreateVendorInput, UpdateVendorInput } from "./vendors.types";

export const vendorKeys = {
  all: ["admin", "vendors"] as const,
  detail: (id: string) => ["admin", "vendors", id] as const,
};

export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.all,
    queryFn: ({ signal }) => vendorsApi.list(signal),
  });
}

export function useVendor(id: string | null, enabled = true) {
  return useQuery({
    queryKey: vendorKeys.detail(id ?? "none"),
    queryFn: ({ signal }) => vendorsApi.detail(id as string, signal),
    enabled: Boolean(id) && enabled,
  });
}

function useRefreshVendors() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: vendorKeys.all });
}

export function useCreateVendor() {
  const refresh = useRefreshVendors();
  return useMutation({ mutationFn: (input: CreateVendorInput) => vendorsApi.create(input), onSuccess: refresh });
}

export function useUpdateVendor() {
  const refresh = useRefreshVendors();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVendorInput }) => vendorsApi.update(id, input),
    onSuccess: refresh,
  });
}

export function useUpdateVendorStatus() {
  const refresh = useRefreshVendors();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => vendorsApi.updateStatus(id, isActive),
    onSuccess: refresh,
  });
}
