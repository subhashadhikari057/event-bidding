import { api, apiRequest } from "@/lib/api-client";
import type { AuthUser, ChangePasswordInput, LoginInput } from "./auth.types";

export const authApi = {
  me: (signal?: AbortSignal) => api.get<AuthUser>("/auth/me", signal),
  login: (input: LoginInput) => api.post<AuthUser>("/auth/login", input),
  logout: () => api.post<{ message: string }>("/auth/logout"),
  changePassword: (input: ChangePasswordInput) => apiRequest<{ message: string }>("/auth/change-password", {
    method: "PATCH",
    body: input,
    suppressUnauthorizedEvent: true,
  }),
};
