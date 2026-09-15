import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import BProgressProvider from "@/components/providers/progress-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-Time Bus Tracking Platform",
  description: "Live bus tracking and transport management for schools and colleges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        <BProgressProvider>
          <AuthProvider>{children}</AuthProvider>
        </BProgressProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
