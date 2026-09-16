import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import BProgressProvider from "@/components/providers/progress-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-Time Bus Tracking Platform",
  description: "Live bus tracking and transport management for schools and colleges",
  icons: {
    icon: "/busapp-logo.jpg",
    shortcut: "/busapp-logo.jpg",
    apple: "/busapp-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`} suppressHydrationWarning>
        <BProgressProvider>
          <AuthProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </AuthProvider>
        </BProgressProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
