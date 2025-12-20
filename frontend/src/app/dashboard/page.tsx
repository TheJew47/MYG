"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; 
import { api, endpoints, setAuthToken } from "@/lib/api"; 
import { 
    VideoCameraIcon, CpuChipIcon, BanknotesIcon, ClockIcon, PlusIcon, ChevronRightIcon 
} from "@heroicons/react/24/outline";
import ProjectCard from "@/components/ui/ProjectCard";
import NewProject from "@/components/modals/NewProject";

export default function DashboardPage() {
  const router = useRouter();
  const { getToken, isLoaded, userId } = useAuth(); 
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const stats = [
      { label: "Active Projects", value: projects.length.toString(), icon: VideoCameraIcon, color: "text-text-accent" },
      { label: "Available Credits", value: "8,450", icon: BanknotesIcon, color: "text-green-500" },
      { label: "AI Generations", value: "142", icon: CpuChipIcon, color: "text-purple-500" },
      { label: "Production Hours", value: "320h", icon: ClockIcon, color: "text-orange-500" },
  ];

  const fetchProjects = async () => {
    try {
      const res = await api.get(endpoints.getProjects);
      setProjects(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isLoaded) {
        if (userId) {
          try {
            const token = await getToken();
            setAuthToken(token); 
            fetchProjects();     
          } catch (e) {
            console.error("Auth error", e);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };
    initAuth();
  }, [isLoaded, userId, getToken]);

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-app-border pb-8">
        <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Workspace</h1>
            <p className="text-text-muted text-sm font-medium">Overview of your creative pipeline and resource usage.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-editor font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-premium shadow-glow"
        >
            <PlusIcon className="w-4 h-4 stroke-[3]" /> Create New Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
            <div key={stat.label} className="bg-app-card border border-app-border p-5 rounded-editor flex items-center justify-between hover:border-app-border/80 transition-premium group relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-white tabular-nums">{stat.value}</h3>
                </div>
                <div className={`p-2.5 rounded-editor bg-app-bg border border-app-border ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5" />
                </div>
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        ))}
      </div>

      {/* Projects Section */}
      <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Recent Library</h2>
                <span className="px-2 py-0.5 bg-app-input border border-app-border rounded text-[10px] text-text-accent font-bold">{projects.length} Total</span>
            </div>
            <button className="text-[11px] font-bold text-text-muted hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest">
                View All <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[200px] bg-app-card/50 border border-app-border animate-pulse rounded-editor"></div>
                ))}
            </div>
          ) : projects.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 bg-app-bg border border-dashed border-app-border rounded-editor text-center px-4 group hover:border-text-accent/50 transition-colors cursor-pointer" onClick={() => setIsModalOpen(true)}>
                <div className="w-12 h-12 bg-app-input rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-6 h-6 text-text-muted" />
                </div>
                <h3 className="text-white font-bold mb-1">Your library is empty</h3>
                <p className="text-text-muted text-xs">Click here to launch your first creative project.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {projects.map((p: any) => (
                <ProjectCard 
                  key={p.id}
                  title={p.title}
                  description={p.description}
                  color={p.color_code}
                  emoji={p.emoji || "📁"}
                  onClick={() => router.push(`/projects/${p.id}`)}
                />
              ))}
            </div>
          )}
      </div>

      <NewProject isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchProjects(); }} />
    </div>
  );
}