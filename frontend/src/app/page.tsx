"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs"; 
import ProjectCard from "@/components/ui/ProjectCard";
import NewProject from "@/components/modals/NewProject";
import { useRouter } from "next/navigation";
import { api, endpoints, setAuthToken } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const { getToken, isLoaded, userId } = useAuth();
  
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. DEFINE the fetch function (This fixes your ReferenceError)
  const fetchProjects = async () => {
    try {
      const res = await api.get(endpoints.getProjects);
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. CALL it inside useEffect (After Auth is ready)
  useEffect(() => {
    const initAuth = async () => {
      if (isLoaded) {
        if (userId) {
          const token = await getToken();
          setAuthToken(token); // Set token for API calls
          fetchProjects();     // Call the function defined above
        } else {
          setLoading(false);
        }
      }
    };
    initAuth();
  }, [isLoaded, userId, getToken]);

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-4xl font-bold mb-8 font-sans text-[#E0E0E0]">Projects</h1>
      
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading your studio...</div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#333] rounded-xl bg-[#1E1E1E]/50">
          <h2 className="text-2xl font-bold text-white mb-2">No Projects Yet</h2>
          <p className="text-gray-500 mb-6">Create your first project to start generating videos.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200">
            Create Project
          </button>
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

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-10 right-10 w-14 h-14 bg-white text-black rounded-full text-3xl font-bold flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
      >
        +
      </button>

      <NewProject 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); fetchProjects(); }} 
      />
    </div>
  );
}