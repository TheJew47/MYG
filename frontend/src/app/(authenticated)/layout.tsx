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
        // If not logged in, boot them back to the landing page
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
    <div className="flex h-screen overflow-hidden bg-[#0B0E14]">
      {/* Sidebar is back, but only for logged-in pages! */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Top Bar is back here too */}
        <TopBar />
        
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
