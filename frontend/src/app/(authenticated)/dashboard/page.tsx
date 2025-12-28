"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, endpoints, supabase } from "@/lib/api"; 
import { VideoCameraIcon, PlusIcon } from "@heroicons/react/24/outline";
import ProjectCard from "@/components/ui/ProjectCard";
import NewProject from "@/components/modals/NewProject";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  
  const fetchProjects = async () => {
    try {
      const res = await api.get(endpoints.getProjects);
      setProjects(res.data);
    } catch (err) { 
      console.error("[Dashboard] Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchProjects();
      } else {
        router.push('/login');
      }
    };
    initAuth();
  }, [router]);

  return (
    <div className="space-y-16 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section: High Contrast Gray */}
      <div className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
                Workspace
            </h1>
            <p className="text-text-accent text-[10px] font-black uppercase tracking-[0.5em] ml-2">
                Creative Production Studio
            </p>
        </div>
        <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-white hover:bg-gray-200 text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-glow active:scale-95"
        >
            <PlusIcon className="w-5 h-5 stroke-[4]" /> New Project
        </button>
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-10">
          <div className="flex items-center gap-6">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] whitespace-nowrap">Recent Library</h2>
              <div className="h-px w-full bg-white/5" />
              <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white font-black tracking-widest">
                {projects.length} ITEMS
              </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-[280px] bg-white/[0.02] border border-white/5 animate-pulse rounded-[2rem]" />)}
            </div>
          ) : projects.length === 0 ? (
             <div 
                className="group flex flex-col items-center justify-center h-[450px] bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem] text-center cursor-pointer hover:bg-white/[0.03] hover:border-white/10 transition-all" 
                onClick={() => { setIsModalOpen(true); }}
             >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <VideoCameraIcon className="w-12 h-12 text-white/10" />
                </div>
                <h3 className="text-white font-black uppercase tracking-[0.2em] text-xl">Studio Empty</h3>
                <p className="text-text-muted text-[10px] mt-3 font-black uppercase tracking-[0.3em]">Launch your first project to begin</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {projects.map((p: any) => (
                <ProjectCard 
                  key={p.id} id={p.id} title={p.title} description={p.description} color={p.color_code} emoji={p.emoji || "📁"}
                  onClick={() => router.push(`/projects/${p.id}`)}
                />
              ))}
            </div>
          )}
      </div>

      <NewProject 
        isOpen={isModalOpen} 
        initialData={editingProject}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingProject(null); 
          fetchProjects(); 
        }} 
      />
    </div>
  );
}
