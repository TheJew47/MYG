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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
        await api.delete(endpoints.deleteProject(id.toString()));
        fetchProjects();
    } catch (err) { 
        console.error("[Dashboard] Delete Error:", err);
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
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase mb-2">Workspace</h1>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Your creative pipeline overview</p>
        </div>
        <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-glow"
        >
            <PlusIcon className="w-4 h-4 stroke-[3]" /> New Project
        </button>
      </div>

      {/* Projects Grid Section */}
      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Recent Library</h2>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-text-accent font-bold">{projects.length}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-[200px] bg-white/5 border border-white/5 animate-pulse rounded-2xl" />)}
            </div>
          ) : projects.length === 0 ? (
             <div 
                className="flex flex-col items-center justify-center h-80 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:bg-white/[0.04] transition-colors" 
                onClick={() => { setIsModalOpen(true); }}
             >
                <VideoCameraIcon className="w-12 h-12 text-white/20 mb-4" />
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Your library is empty</h3>
                <p className="text-text-muted text-[10px] mt-2 font-bold uppercase tracking-widest">Create your first project to start</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((p: any) => (
                <ProjectCard 
                  key={p.id} id={p.id} title={p.title} description={p.description} color={p.color_code} emoji={p.emoji || "📁"}
                  onClick={() => { router.push(`/projects/${p.id}`); }}
                  onEdit={() => { setEditingProject(p); setIsModalOpen(true); }}
                  onDelete={() => handleDelete(p.id)}
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
