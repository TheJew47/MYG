"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/api";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Ensure this matches your project's URL settings in Supabase
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      setMessage({ 
        type: 'success', 
        text: "Registration successful! Please check your email for the confirmation link." 
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center p-6">
      {/* Back to Landing Link */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Create Account</h1>
          <p className="text-text-muted text-sm font-medium">Join Miyog and start building your creative pipeline.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center border ${
              message.type === 'error' 
                ? "bg-red-500/10 border-red-500/20 text-red-500" 
                : "bg-green-500/10 border-green-500/20 text-green-500"
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161B26] border border-white/5 rounded-xl p-4 text-sm text-white focus:border-text-accent outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161B26] border border-white/5 rounded-xl p-4 text-sm text-white focus:border-text-accent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-glow mt-4 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted font-medium">
          Already have an account?{" "}
          <Link href="/login" className="text-text-accent hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
