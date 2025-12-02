"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, endpoints } from "@/lib/api";
import { VideoCameraIcon } from "@heroicons/react/24/outline";

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(endpoints.getProjectDetails(params.id));
      setProject(res.data);
    } catch (error) { console.error("Failed to fetch project", error); }
  };

  useEffect(() => { fetchProjectDetails(); }, [params.id]);

  if (!project) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="p-8 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">{project.title} Content</h1>
        <button 
            onClick={() => router.push(`/projects/${params.id}/create`)} 
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-sm font-bold text-sm hover:bg-gray-200 uppercase tracking-wide"
        >
          <VideoCameraIcon className="w-5 h-5" /> Create
        </button>
      </div>

      <div className="flex-1 bg-[#1E1E1E] border border-[#333] rounded-md overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#333] text-xs font-bold text-gray-500 uppercase">
            <div className="col-span-5">Video</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-5 text-right">Status</div>
        </div>
        <div className="overflow-y-auto flex-1">
            {project.tasks?.map((task: any) => (
                <div 
                    key={task.id} 
                    onClick={() => router.push(`/projects/${params.id}/create?taskId=${task.id}`)}
                    className="grid grid-cols-12 gap-4 p-4 border-b border-[#333] hover:bg-[#252525] group items-center cursor-pointer transition-colors"
                >
                    <div className="col-span-5 font-bold text-white">{task.title}</div>
                    <div className="col-span-2 text-xs text-gray-300">{new Date(task.created_at).toLocaleDateString()}</div>
                    <div className={`col-span-5 text-right text-xs font-bold ${
                        task.status === 'Completed' ? 'text-green-500' : 
                        task.status === 'Processing' ? 'text-blue-500' : 'text-gray-500'
                    }`}>
                        {task.status}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}