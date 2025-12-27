"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, endpoints } from "@/lib/api";
import { 
  VideoCameraIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";
import SetupEditor from "@/components/modals/SetupEditor";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(endpoints.getProjectDetails(params.id));
      setProject(res.data);
    } catch (error) { 
      console.error("Failed to fetch project", error); 
    }
  };

  useEffect(() => { 
    fetchProjectDetails(); 
  }, [params.id]);

  const handleSetupConfirm = (config: { fps: number; resolution: string; duration: number }) => {
    const query = new URLSearchParams({
      fps: config.fps.toString(),
      res: config.resolution,
      dur: config.duration.toString()
    }).toString();
    
    router.push(`/projects/${params.id}/create?${query}`);
  };

  if (!project) return (
    <div className="p-8 flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-2 border-text-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Loading Project Resources...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 h-full flex flex-col overflow-hidden max-w-[1400px] mx-auto">
      {/* Header with Breadcrumbs & Action */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            <span>Projects</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className="text-text-accent">{project.title}</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Library</h1>
        </div>
        
        <button 
            onClick={() => setIsSetupOpen(true)} 
            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-editor font-bold text-xs uppercase tracking-widest transition-premium shadow-glow"
        >
          <VideoCameraIcon className="w-4 h-4 stroke-[2.5]" /> Create Content
        </button>
      </div>

      {/* Main Content Area: Obsidian List View */}
      <div className="flex-1 bg-app-card border border-app-border rounded-editor overflow-hidden flex flex-col shadow-premium">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-app-bg border-b border-app-border text-[10px] font-black text-text-muted uppercase tracking-[0.15em]">
            <div className="col-span-6 flex items-center gap-2">Asset Name</div>
            <div className="col-span-2">Date Created</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {project.tasks?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="w-16 h-16 bg-app-input rounded-full flex items-center justify-center">
                        <VideoCameraIcon className="w-8 h-8 text-text-muted opacity-20" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-white font-bold">No assets found</h3>
                        <p className="text-text-muted text-xs">This project doesn't have any generated content yet.</p>
                    </div>
                </div>
            ) : (
                project.tasks?.map((task: any) => (
                    <div 
                        key={task.id} 
                        onClick={() => router.push(`/projects/${params.id}/create?taskId=${task.id}`)}
                        className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-white/[0.03] hover:bg-app-hover group items-center cursor-pointer transition-premium relative"
                    >
                        {/* Hover Indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-text-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="col-span-6 flex items-center gap-4">
                            <div className="w-10 h-10 bg-app-bg rounded-md border border-app-border flex items-center justify-center flex-shrink-0 group-hover:border-text-accent/30 transition-colors">
                                <VideoCameraIcon className="w-5 h-5 text-text-muted group-hover:text-text-accent transition-colors" />
                            </div>
                            <div>
                                <div className="font-bold text-white text-[13px] tracking-tight group-hover:text-text-accent transition-colors">{task.title}</div>
                                {/* FIXED: Wrapped task.id in String() to prevent substring error */}
                                <div className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Asset ID: {String(task.id).substring(0, 8)}</div>
                            </div>
                        </div>

                        <div className="col-span-2 flex flex-col">
                            <span className="text-xs text-text-main font-medium">{new Date(task.created_at).toLocaleDateString()}</span>
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="col-span-2 flex items-center gap-2 text-xs text-text-muted">
                            <ClockIcon className="w-3 h-3" />
                            <span className="font-mono">00:{task.duration || "15"}s</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                task.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                task.status === 'Processing' ? 'bg-text-accent/10 text-text-accent border-text-accent/20' : 
                                'bg-app-input text-text-muted border-app-border'
                            }`}>
                                {task.status === 'Completed' ? <CheckCircleIcon className="w-3 h-3" /> : 
                                 task.status === 'Processing' ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : null}
                                {task.status}
                            </div>
                            <button className="p-1 hover:bg-app-input rounded text-text-muted hover:text-white transition-colors">
                                <EllipsisHorizontalIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Footer Stats Placeholder */}
      <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-2">
         <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>{project.tasks?.filter((t: any) => t.status === 'Completed').length || 0} Ready</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-text-accent animate-pulse" />
                <span>{project.tasks?.filter((t: any) => t.status === 'Processing').length || 0} Processing</span>
            </div>
         </div>
         <div>Total Storage: 1.2GB / 10GB</div>
      </div>

      <SetupEditor 
        isOpen={isSetupOpen} 
        onClose={() => setIsSetupOpen(false)} 
        onConfirm={handleSetupConfirm} 
      />
    </div>
  );
}