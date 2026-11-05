"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  FileText,
  Gavel,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandMark } from "@/components/shared/brand-mark";
import { authApi } from "@/features/auth/auth.api";
import { ChangePasswordDialog } from "@/features/auth/components/change-password-dialog";
import type { UserRole } from "@/features/auth/auth.types";
import { useAuth } from "@/features/auth/use-auth";
import { getErrorMessage } from "@/lib/api-client";
import { userInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const adminNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Vendors", href: "/admin/vendors", icon: Store },
  { label: "Work Requests", href: "/admin/work-requests", icon: ClipboardList },
  { label: "Bids", href: "/admin/bids", icon: Gavel },
  { label: "Bookings", href: "/admin/bookings", icon: BriefcaseBusiness },
];

const vendorNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Assigned Requests", href: "/vendor/requests", icon: FileText },
  { label: "My Bids", href: "/vendor/bids", icon: Gavel },
  { label: "My Bookings", href: "/vendor/bookings", icon: WalletCards },
];

function SidebarContent({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const auth = useAuth();
  const navigation = role === "ADMIN" ? adminNavigation : vendorNavigation;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-20 items-center px-5"><BrandMark /></div>
      <Separator />
      <nav className="flex-1 space-y-1 p-3" aria-label={`${role.toLowerCase()} navigation`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === pathname || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.label} href={item.href} onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors", active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}>
              <Icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {auth.user ? (
        <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <Avatar><AvatarFallback className="bg-indigo-100 font-semibold text-indigo-700">{userInitials(auth.user.name)}</AvatarFallback></Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{auth.user.name}</p>
              <p className="truncate text-xs text-slate-500">{auth.user.email}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardLayout({ children, role }: { children: ReactNode; role: UserRole }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
    onError: (error) => toast.error("Could not sign out", { description: getErrorMessage(error) }),
  });

  return (
    <div className="min-h-svh bg-slate-50 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200 lg:block"><div className="fixed inset-y-0 w-[240px]"><SidebarContent role={role} /></div></aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0" showCloseButton={false}>
                <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle><SheetDescription>Primary workspace navigation</SheetDescription></SheetHeader>
                <SidebarContent role={role} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-sm font-semibold text-slate-950">{role === "ADMIN" ? "Admin Portal" : "Vendor Portal"}</p>
              <p className="hidden text-xs text-slate-500 sm:block">Mero Event workspace</p>
            </div>
          </div>
          {auth.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Open account menu">
                  <Avatar><AvatarFallback className="bg-indigo-100 font-semibold text-indigo-700">{userInitials(auth.user.name)}</AvatarFallback></Avatar>
                  <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{auth.user.name}</span>
                  <ChevronDown className="size-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="p-2">
                  <span className="block truncate text-sm font-medium text-slate-900">{auth.user.name}</span>
                  <span className="mt-1 block truncate text-xs font-normal text-slate-500">{auth.user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500"><BadgeCheck className="size-4 text-indigo-500" />{auth.user.role} account</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)} className="px-2 py-2"><KeyRound />Change Password</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={logout.isPending} onSelect={() => logout.mutate()} className="px-2 py-2"><LogOut />{logout.isPending ? "Signing out…" : "Sign out"}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  );
}
