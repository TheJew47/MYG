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
      {/* 1. Sidebar: Fixed to the left (64px width) */}
      <Sidebar />
      
      {/* 2. Main Container */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative bg-[#0B0E14]">
        
        {/* 3. TopBar: Fixed to the top (56px height) */}
        <TopBar />
        
        {/* 4. Content Area: 
          - pt-14: Offsets the 56px TopBar height.
          - pl-16: Offsets the 64px Sidebar width.
          - The inner div uses pr-0 to ensure no padding on the right edge.
          - pl-12 and pt-12 provide the gap between elements and the bars.
        */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pt-14 pl-16">
          <div className="w-full h-full pt-12 pl-12 pr-0 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
