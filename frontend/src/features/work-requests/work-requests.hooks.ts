import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workRequestsApi } from "./work-requests.api";
import type { WorkRequestInput } from "./work-requests.types";

export const workRequestKeys = {
  admin: ["admin", "work-requests"] as const,
  detail: (id: string) => ["admin", "work-requests", id] as const,
  invitations: (id: string) => ["admin", "work-requests", id, "invitations"] as const,
  vendor: ["vendor", "requests"] as const,
  vendorDetail: (id: string) => ["vendor", "requests", id] as const,
};

export function useWorkRequests() {
  return useQuery({ queryKey: workRequestKeys.admin, queryFn: ({ signal }) => workRequestsApi.list(signal) });
}

export function useWorkRequest(id: string) {
  return useQuery({ queryKey: workRequestKeys.detail(id), queryFn: ({ signal }) => workRequestsApi.detail(id, signal), enabled: Boolean(id) });
}

function useInvalidateRequests() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: workRequestKeys.admin });
}

export function useCreateWorkRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: (input: WorkRequestInput) => workRequestsApi.create(input), onSuccess: invalidate });
}

export function useUpdateWorkRequest() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: WorkRequestInput }) => workRequestsApi.update(id, input), onSuccess: invalidate });
}

export function useDeleteWorkRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workRequestsApi.remove(id),
    onSuccess: (_data, id) => Promise.all([
      client.invalidateQueries({ queryKey: workRequestKeys.admin }),
      client.removeQueries({ queryKey: workRequestKeys.detail(id) }),
    ]),
  });
}

export function useUploadRequestPhotos() {
  const invalidate = useInvalidateRequests();
  return useMutation({ mutationFn: ({ id, files }: { id: string; files: File[] }) => workRequestsApi.uploadPhotos(id, files), onSuccess: invalidate });
}

export function useRequestInvitations(id: string) {
  return useQuery({ queryKey: workRequestKeys.invitations(id), queryFn: ({ signal }) => workRequestsApi.invitations(id, signal), enabled: Boolean(id) });
}

export function useInviteVendors() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, vendorIds }: { id: string; vendorIds: string[] }) => workRequestsApi.invite(id, vendorIds),
    onSuccess: (_data, variables) => Promise.all([
      client.invalidateQueries({ queryKey: workRequestKeys.admin }),
      client.invalidateQueries({ queryKey: workRequestKeys.invitations(variables.id) }),
      client.invalidateQueries({ queryKey: workRequestKeys.vendor }),
    ]),
  });
}

export function useAssignedRequests() {
  return useQuery({ queryKey: workRequestKeys.vendor, queryFn: ({ signal }) => workRequestsApi.assigned(signal) });
}

export function useAssignedRequest(id: string) {
  return useQuery({ queryKey: workRequestKeys.vendorDetail(id), queryFn: ({ signal }) => workRequestsApi.assignedDetail(id, signal), enabled: Boolean(id) });
}
