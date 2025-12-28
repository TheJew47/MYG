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
        alert("Failed to delete project."); 
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const initAuth = async () => {
      // Replaced Clerk logic with Supabase session check
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // api.ts interceptor automatically handles the JWT token now
        fetchProjects();
      } else {
        router.push('/login');
      }
    };
    initAuth();
  }, [router]);

  return (
    <div className="p-8 space-y-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header Section - Restored structure from your old code */}
      <div className="flex justify-between items-end border-b border-white/5 pb-10">
        <div className="space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">Workspace</h1>
            <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.4em]">Overview of your creative pipeline.</p>
        </div>
        <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-glow"
        >
            <PlusIcon className="w-5 h-5 stroke-[3]" /> New Project
        </button>
      </div>

      {/* Project Grid Section - Restored sections from your old code */}
      <div className="space-y-8">
          <div className="flex items-center gap-4">
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Recent Library</h2>
              <div className="h-px flex-1 bg-white/5" />
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white font-bold tracking-widest">
                {projects.length} TOTAL
              </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[240px] bg-white/[0.03] border border-white/5 animate-pulse rounded-2xl" />
                ))}
            </div>
          ) : projects.length === 0 ? (
             <div 
                className="flex flex-col items-center justify-center h-80 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[2rem] text-center cursor-pointer hover:bg-white/[0.03] transition-all group" 
                onClick={() => { setIsModalOpen(true); }}
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PlusIcon className="w-10 h-10 text-white/20" />
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-lg">Your library is empty</h3>
                <p className="text-text-muted text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Create your first project to get started.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map((p: any) => (
                <ProjectCard 
                  key={p.id} id={p.id} title={p.title} description={p.description} color={p.color_code} emoji={p.emoji || "📁"}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  onEdit={() => handleEdit(p)}
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
