"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, endpoints, supabase } from "@/lib/api"; 
import { VideoCameraIcon, CpuChipIcon, BanknotesIcon, ClockIcon, PlusIcon } from "@heroicons/react/24/outline";
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
      // Check Supabase session instead of Clerk
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
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end border-b border-app-border pb-8">
        <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Workspace</h1>
            <p className="text-text-muted text-sm font-medium">Overview of your creative pipeline.</p>
        </div>
        <button 
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-editor font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-premium shadow-glow"
        >
            <PlusIcon className="w-4 h-4 stroke-[3]" /> New Project
        </button>
      </div>

      <div className="space-y-6">
          <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-tighter">Recent Library</h2>
              <span className="px-2 py-0.5 bg-app-input border border-app-border rounded text-[10px] text-text-accent font-bold">{projects.length} Total</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-[200px] bg-app-card/50 border border-app-border animate-pulse rounded-editor" />)}
            </div>
          ) : projects.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 bg-app-bg border border-dashed border-app-border rounded-editor text-center cursor-pointer" onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
                <PlusIcon className="w-12 h-12 text-text-muted mb-4" />
                <h3 className="text-white font-bold">Your library is empty</h3>
                <p className="text-text-muted text-xs">Create your first project to get started.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {projects.map((p: any) => (
                <ProjectCard 
                  key={p.id} id={p.id} title={p.title} description={p.description} color={p.color_code} emoji={p.emoji || "📁"}
                  onClick={() => { router.push(`/projects/${p.id}`); }}
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
