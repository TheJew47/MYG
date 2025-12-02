"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; // 1. Import useAuth
import { api, endpoints, setAuthToken } from "@/lib/api"; // 2. Import setAuthToken
import { 
    VideoCameraIcon, CpuChipIcon, BanknotesIcon, ClockIcon, PlusIcon 
} from "@heroicons/react/24/outline";
import ProjectCard from "@/components/ui/ProjectCard";
import NewProject from "@/components/modals/NewProject";

export default function DashboardPage() {
  const router = useRouter();
  const { getToken, isLoaded, userId } = useAuth(); // 3. Get Auth state
  
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const stats = [
      { label: "Total Projects", value: projects.length.toString(), icon: VideoCameraIcon, color: "text-blue-400" },
      { label: "Credits Left", value: "8,450", icon: BanknotesIcon, color: "text-green-400" },
      { label: "Videos Generated", value: "142", icon: CpuChipIcon, color: "text-purple-400" },
      { label: "Hours Saved", value: "320h", icon: ClockIcon, color: "text-orange-400" },
  ];

  const fetchProjects = async () => {
    try {
      const res = await api.get(endpoints.getProjects);
      setProjects(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // 4. UPDATED USE EFFECT: Wait for Auth before fetching
  useEffect(() => {
    const initAuth = async () => {
      // Only proceed if Clerk has finished loading
      if (isLoaded) {
        if (userId) {
          try {
            const token = await getToken();
            setAuthToken(token); // Set the token in axios
            fetchProjects();     // NOW fetch data
          } catch (e) {
            console.error("Auth error", e);
            setLoading(false);
          }
        } else {
          // If not logged in, stop loading (middleware handles redirect usually)
          setLoading(false);
        }
      }
    };
    
    initAuth();
  }, [isLoaded, userId, getToken]);

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-text-muted">Manage your digital content pipeline.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
            <PlusIcon className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
            <div key={stat.label} className="bg-app-card border border-app-border p-6 rounded-xl flex items-start justify-between hover:border-text-muted transition-colors group">
                <div>
                    <p className="text-text-muted text-xs uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-app-input ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
            </div>
        ))}
      </div>

      <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Recent Projects</h2>
          {loading ? (
            <div className="h-40 bg-app-card animate-pulse rounded-xl"></div>
          ) : projects.length === 0 ? (
             <div className="text-center p-10 bg-app-card border border-dashed border-app-border rounded-xl text-text-muted">
                No projects yet. Start creating!
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
