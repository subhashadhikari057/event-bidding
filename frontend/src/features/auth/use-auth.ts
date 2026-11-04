"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { authApi } from "./auth.api";

export const authQueryKey = ["auth", "me"] as const;

export function useAuth() {
  const query = useQuery({
    queryKey: authQueryKey,
    queryFn: ({ signal }) => authApi.me(signal),
    retry: false,
    staleTime: 60_000,
  });
  const unauthenticated = query.error instanceof ApiError && query.error.status === 401;

  return {
    user: query.data,
    loading: query.isPending,
    authenticated: Boolean(query.data),
    unauthenticated,
    error: query.error,
    refetch: query.refetch,
  };
}
