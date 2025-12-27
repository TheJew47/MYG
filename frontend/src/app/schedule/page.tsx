"use client";
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon,
  FunnelIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";

export default function SchedulePage() {
  // Generate fake data for the calendar grid (Github-style heat map)
  const days = Array.from({ length: 371 }); // ~53 weeks
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-app-border pb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Content Calendar</h1>
          <p className="text-text-muted text-sm font-medium">Visualize and manage your posting frequency across platforms.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-app-input border border-app-border rounded-editor p-1">
            <button className="px-4 py-1.5 rounded-editor text-[11px] font-black uppercase tracking-widest text-white bg-app-hover shadow-premium transition-premium">Year</button>
            <button className="px-4 py-1.5 rounded-editor text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-premium">Month</button>
          </div>
          <div className="h-6 w-[1px] bg-app-border mx-1"></div>
          <button className="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-editor font-bold text-[11px] uppercase tracking-widest transition-premium shadow-glow flex items-center gap-2">
            <PlusIcon className="w-3.5 h-3.5 stroke-[3]" /> Schedule Post
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-app-card border border-app-border rounded-editor p-10 flex flex-col gap-8 shadow-premium relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-text-accent/5 blur-[100px] pointer-events-none" />

        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Posting Intensity (2025)</h3>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-app-bg border border-app-border rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-accent animate-pulse" />
                    <span className="text-[9px] font-bold text-text-accent uppercase tracking-tighter">Live Sync Active</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-app-hover rounded-editor text-text-muted transition-colors"><ChevronLeftIcon className="w-4 h-4"/></button>
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">2025</span>
                <button className="p-1.5 hover:bg-app-hover rounded-editor text-text-muted transition-colors"><ChevronRightIcon className="w-4 h-4"/></button>
            </div>
        </div>

        {/* Heatmap Area */}
        <div className="relative">
            {/* Month Labels */}
            <div className="flex justify-between mb-4 px-2">
                {months.map(m => (
                    <span key={m} className="text-[9px] font-black uppercase tracking-widest text-text-muted">{m}</span>
                ))}
            </div>

            <div className="flex flex-wrap gap-[3px] h-full content-start">
                {days.map((_, i) => {
                    // Randomly assign activity levels for demo
                    // 0: none, 1: low, 2: medium, 3: high (accent color)
                    const rand = Math.random();
                    const level = rand > 0.92 ? 3 : (rand > 0.85 ? 2 : (rand > 0.7 ? 1 : 0));
                    
                    const colors = [
                        "bg-app-input border-transparent", 
                        "bg-text-accent/20 border-text-accent/10", 
                        "bg-text-accent/50 border-text-accent/20", 
                        "bg-text-accent border-white/20 shadow-glow"
                    ];
                    
                    return (
                        <div 
                            key={i} 
                            className={`w-[13px] h-[13px] rounded-[2px] border ${colors[level]} hover:ring-1 ring-white/50 transition-all cursor-crosshair group relative`}
                        >
                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[9px] font-black rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-premium">
                                DAY {i+1}: {level} GENERATIONS
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between border-t border-app-border pt-8">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <FunnelIcon className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-tight">Filter by platform:</span>
                </div>
                <div className="flex gap-2">
                    {['YouTube', 'TikTok', 'Instagram'].map(p => (
                        <button key={p} className="px-3 py-1 bg-app-input border border-app-border rounded-full text-[9px] font-bold text-text-muted hover:text-white transition-colors">{p}</button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span>Inactive</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 bg-app-input rounded-sm"></div>
                    <div className="w-3 h-3 bg-text-accent/30 rounded-sm"></div>
                    <div className="w-3 h-3 bg-text-accent/60 rounded-sm"></div>
                    <div className="w-3 h-3 bg-text-accent rounded-sm"></div>
                </div>
                <span>Peak Output</span>
            </div>
        </div>
      </div>

      {/* Upcoming Tasks Section */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Upcoming Releases</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-app-card border border-app-border p-4 rounded-editor flex items-center justify-between group hover:border-text-accent/30 transition-premium cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-app-input rounded-md flex items-center justify-center text-text-muted group-hover:text-text-accent transition-colors">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-white">Project_Post_{i}.mp4</p>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-tighter">Dec {15 + i}, 2025 • 10:00 AM</p>
                        </div>
                    </div>
                    <button className="p-1 hover:bg-app-hover rounded text-text-muted transition-colors">
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}