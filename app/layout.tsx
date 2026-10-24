import type { Metadata } from "next";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import RightSidebar from "@/components/RightSidebar";
import { RoleProvider } from "@/components/RoleProvider";

export const metadata: Metadata = {
  title: "FAMU-SOE Capstone and Lab Hub | Canvas LMS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas-bg font-sans text-slate-800 antialiased min-h-screen flex pb-16 md:pb-0">
        <RoleProvider>
          <GlobalNav />

          {/* MAIN CANVAS CONTENT AREA */}
          <div className="flex-grow min-w-0 flex flex-col lg:flex-row overflow-x-hidden">
            <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">{children}</main>

            <RightSidebar />
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
