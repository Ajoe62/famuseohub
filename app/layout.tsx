import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "FAMU-SOE Capstone and Lab Hub",
};

// Runs inside a Canvas iframe: Canvas provides the global navigation and course chrome.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas-bg font-sans text-slate-800 antialiased min-h-screen">
        <Toaster>
          <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">{children}</main>
        </Toaster>
      </body>
    </html>
  );
}
