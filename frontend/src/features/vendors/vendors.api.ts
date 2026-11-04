import { api } from "@/lib/api-client";
import type {
  CreateVendorInput,
  ResetVendorPasswordResponse,
  UpdateVendorInput,
  Vendor,
} from "./vendors.types";

export const vendorsApi = {
  list: (signal?: AbortSignal) => api.get<Vendor[]>("/vendors", signal),
  detail: (id: string, signal?: AbortSignal) => api.get<Vendor>(`/vendors/${id}`, signal),
  create: (input: CreateVendorInput) => api.post<Vendor>("/vendors", input),
  update: (id: string, input: UpdateVendorInput) => api.patch<Vendor>(`/vendors/${id}`, input),
  updateStatus: (id: string, isActive: boolean) =>
    api.patch<Vendor>(`/vendors/${id}/status`, { isActive }),
  resetPassword: (id: string) =>
    api.post<ResetVendorPasswordResponse>(`/auth/vendors/${id}/reset-password`),
};
