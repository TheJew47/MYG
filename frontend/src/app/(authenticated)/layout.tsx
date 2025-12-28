"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/api";
import Sidebar from "@/components/layouts/Sidebar";
import TopBar from "@/components/layouts/TopBar";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0E14]">
      {/* Sidebar: Fixed to left */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {/* Top Bar: Fixed to top */}
        <TopBar />
        
        {/* Main Workspace: Full width and scrollable */}
        <main className="flex-1 overflow-y-auto p-10 lg:p-16 custom-scrollbar bg-[#0B0E14]">
          <div className="w-full h-full animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
