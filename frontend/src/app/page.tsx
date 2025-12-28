"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/api";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Redirect logged-in users to the protected dashboard
          router.push("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  // Prevent flash of landing page content while checking session
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0E14] text-white p-6 selection:bg-text-accent/30">
      {/* Background Glow Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-text-accent/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter italic uppercase leading-none">
            Miyog
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-accent ml-2">
            AI Video Engine
          </p>
        </div>
        
        <p className="text-text-muted text-sm md:text-base font-medium max-w-md leading-relaxed">
          The ultimate digital creative pipeline. Generate, edit, and scale your content with human-like AI avatars.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
          <Link 
            href="/login" 
            className="bg-white text-black px-10 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all text-center shadow-glow"
          >
            Sign In
          </Link>
          <Link 
            href="/signup" 
            className="bg-[#161B26] border border-white/10 text-white px-10 py-4 rounded-xl font-bold hover:bg-white/5 transition-all text-center"
          >
            Create Account
          </Link>
        </div>

        <div className="pt-12 flex items-center gap-8 opacity-20 grayscale">
          <span className="text-[10px] font-black uppercase tracking-widest">Next.js 14</span>
          <span className="text-[10px] font-black uppercase tracking-widest">Supabase</span>
          <span className="text-[10px] font-black uppercase tracking-widest">AWS EC2</span>
        </div>
      </div>
    </div>
  );
}
