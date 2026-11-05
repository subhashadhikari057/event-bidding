import { Suspense } from "react";
import Image from "next/image";
import { BadgeCheck, CalendarDays, Handshake } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#f5f6f8] p-3 sm:p-5 lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(232,211,116,0.16),_transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_32px_90px_-40px_rgba(15,23,42,0.42)] sm:min-h-[calc(100svh-2.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[calc(100svh-3.5rem)]">
        <section className="relative hidden overflow-hidden bg-[#19223c] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[32rem] rounded-full border border-[#e8d374]/15" />
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-[#e8d374]/20" />
          <div className="relative flex items-center gap-3">
            <Image src="/logo.svg" width={58} height={58} alt="Mero Event" className="size-14 rounded-full shadow-lg shadow-black/20" preload />
            <div><p className="text-lg font-semibold tracking-tight">Mero Event</p><p className="mt-0.5 text-xs text-slate-300">Vendor bidding &amp; booking</p></div>
          </div>

          <div className="relative max-w-lg py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#e8d374]">One connected workspace</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">From vendor quotation to confirmed event.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300">Manage event requirements, compare trusted vendors, confirm bookings and follow every payment from one secure workspace.</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><Handshake className="size-5 text-[#e8d374]" /><p className="mt-3 text-sm font-medium">Trusted vendors</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><CalendarDays className="size-5 text-[#e8d374]" /><p className="mt-3 text-sm font-medium">Event workflow</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><BadgeCheck className="size-5 text-[#e8d374]" /><p className="mt-3 text-sm font-medium">Secure access</p></div>
            </div>
          </div>

          <p className="relative text-xs text-slate-400">Built for organized, transparent event procurement.</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <BrandMark className="mb-12 lg:hidden" />
            <div className="mb-8">
              <p className="text-sm font-semibold text-indigo-600">Secure workspace access</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Sign in with your Mero Event admin or vendor account to continue.</p>
            </div>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-slate-100" />}><LoginForm /></Suspense>
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-center text-xs leading-5 text-slate-500">Vendor access issues? Contact Mero Event administration.</p>
              <p className="mt-2 text-center text-[11px] text-slate-400">Mero Event Nepal · Protected workspace</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
