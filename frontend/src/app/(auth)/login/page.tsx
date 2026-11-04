import { Suspense } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.09),_transparent_34%)]" />
      <div className="relative w-full max-w-md">
        <BrandMark className="mb-7 justify-center" />
        <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="space-y-2 px-6 pt-7 text-center sm:px-8">
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950">Welcome back</CardTitle>
            <CardDescription className="text-sm text-slate-500">Sign in to your Mero Event workspace.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-7 sm:px-8">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-100" />}><LoginForm /></Suspense>
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">Vendor access issues? Contact Mero Event administration.</p>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-slate-400">Secure workspace access · Mero Event Nepal</p>
      </div>
    </main>
  );
}
