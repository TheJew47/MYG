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
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0E14] text-white">
      {/* 1. Sidebar: Fixed to the left with no border-right blue tint */}
      <Sidebar />
      
      {/* 2. Main Container: Full viewport height and width */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative bg-[#0B0E14]">
        
        {/* 3. TopBar: Integrated into the dark theme */}
        <TopBar />
        
        {/* 4. Content Area: Full width (no max-width constraint) and scrollable */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full p-10 md:p-14 lg:p-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
