"use client";
import React from "react";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0E14]">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#0B0E14] custom-scrollbar">
          {/* This wrapper centers the content and scales it correctly */}
          <div className="max-w-[1400px] mx-auto w-full px-8 py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
