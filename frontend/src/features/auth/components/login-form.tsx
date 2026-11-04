"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api-client";
import { authApi } from "../auth.api";
import type { AuthUser } from "../auth.types";
import { authQueryKey, useAuth } from "../use-auth";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function destinationFor(user: AuthUser, requested: string | null): string {
  const defaultPath = user.role === "ADMIN" ? "/admin/dashboard" : "/vendor/dashboard";
  if (!requested?.startsWith("/")) return defaultPath;
  if (user.role === "ADMIN" && requested.startsWith("/admin/")) return requested;
  if (user.role === "VENDOR" && requested.startsWith("/vendor/")) return requested;
  return defaultPath;
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKey, user);
      toast.success("Welcome back", { description: `Signed in as ${user.name}.` });
      router.replace(destinationFor(user, searchParams.get("next")));
    },
  });

  useEffect(() => {
    if (auth.user) router.replace(destinationFor(auth.user, searchParams.get("next")));
  }, [auth.user, router, searchParams]);

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => login.mutate(values))} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
        {form.formState.errors.email ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" className="pr-10" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
          <button type="button" className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {form.formState.errors.password ? <p className="text-xs text-red-600" role="alert">{form.formState.errors.password.message}</p> : null}
      </div>
      {login.error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">{getErrorMessage(login.error)}</div> : null}
      <Button type="submit" size="lg" className="h-11 w-full" disabled={login.isPending}>
        {login.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
