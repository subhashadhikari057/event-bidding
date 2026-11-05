import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "Mero Event",
  description: "Vendor bidding and booking management",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 font-sans text-slate-950">
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
