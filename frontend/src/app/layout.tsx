// frontend/src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Miyog - AI Video Engine",
  description: "Create stunning AI videos in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar will now show on every page */}
          <Sidebar />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* TopBar will now show on every page */}
            <TopBar />
            
            <main className="flex-1 overflow-y-auto relative bg-[#0B0E14]">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
