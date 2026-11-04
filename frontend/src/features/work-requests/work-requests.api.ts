import { api } from "@/lib/api-client";
import type {
  AssignedRequest,
  AssignedRequestDetail,
  RequestInvitation,
  RequestPhoto,
  WorkRequest,
  WorkRequestInput,
  WorkRequestSummary,
} from "./work-requests.types";

export const workRequestsApi = {
  list: (signal?: AbortSignal) => api.get<WorkRequestSummary[]>("/work-requests", signal),
  detail: (id: string, signal?: AbortSignal) => api.get<WorkRequest>(`/work-requests/${id}`, signal),
  create: (input: WorkRequestInput) => api.post<WorkRequest>("/work-requests", input),
  update: (id: string, input: WorkRequestInput) => api.patch<WorkRequest>(`/work-requests/${id}`, input),
  uploadPhotos: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    return api.post<RequestPhoto[]>(`/work-requests/${id}/photos`, formData);
  },
  invitations: (id: string, signal?: AbortSignal) => api.get<RequestInvitation[]>(`/work-requests/${id}/invitations`, signal),
  invite: (id: string, vendorIds: string[]) => api.post<RequestInvitation[]>(`/work-requests/${id}/invitations`, { vendorIds }),
  assigned: (signal?: AbortSignal) => api.get<AssignedRequest[]>("/vendor/requests", signal),
  assignedDetail: (id: string, signal?: AbortSignal) => api.get<AssignedRequestDetail>(`/vendor/requests/${id}`, signal),
};
