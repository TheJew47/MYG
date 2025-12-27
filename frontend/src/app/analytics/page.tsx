"use client";
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon, 
  ClockIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  VideoCameraIcon // Added missing import
} from "@heroicons/react/24/outline";

export default function AnalyticsPage() {
  const stats = [
    { label: "Total Views", value: "1.2M", change: "+12.5%", trendingUp: true, icon: UsersIcon },
    { label: "Avg. Watch Time", value: "0:45", change: "+2.1%", trendingUp: true, icon: ClockIcon },
    { label: "Engagement Rate", value: "8.4%", change: "-0.5%", trendingUp: false, icon: ArrowTrendingUpIcon },
    { label: "Content Created", value: "142", change: "+18", trendingUp: true, icon: ChartBarIcon },
  ];

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-app-border pb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Insights</h1>
          <p className="text-text-muted text-sm font-medium">Performance metrics across your digital pipeline.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-app-input border border-app-border rounded-editor px-4 py-2 cursor-pointer hover:bg-app-hover transition-premium">
            <span className="text-[11px] font-black uppercase tracking-widest text-text-muted">Last 30 Days</span>
            <ChevronDownIcon className="w-3 h-3 text-text-muted" />
          </div>
          <button className="bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-editor font-bold text-[11px] uppercase tracking-widest transition-premium shadow-glow">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-app-card border border-app-border p-5 rounded-editor flex flex-col justify-between hover:border-app-border/80 transition-premium group">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-md bg-app-bg border border-app-border text-text-muted group-hover:text-text-accent transition-colors">
                <stat.icon className="w-4 h-4" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trendingUp ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
                {stat.trendingUp ? <ArrowUpRightIcon className="w-3 h-3" /> : <ArrowDownRightIcon className="w-3 h-3" />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-text-muted text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white tabular-nums">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Placeholder */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-[400px]">
        {/* Performance Graph */}
        <div className="col-span-12 lg:col-span-8 bg-app-card border border-app-border rounded-editor overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-app-border flex justify-between items-center bg-black/20">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Performance Overview</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-text-accent" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Reach</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Interaction</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative group cursor-crosshair">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-text-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="text-center space-y-2">
              <ChartBarIcon className="w-10 h-10 text-app-border mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-border">Data visualization coming soon</p>
              <p className="text-[9px] text-text-muted italic opacity-50">Syncing with production servers...</p>
            </div>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-app-card border border-app-border rounded-editor p-6 h-full flex flex-col">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white mb-6">Top Performing Content</h3>
            <div className="flex-1 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-editor bg-app-bg border border-app-border/50 hover:border-text-accent/30 transition-premium cursor-pointer group">
                  <div className="w-12 h-12 bg-app-input rounded-md flex-shrink-0 overflow-hidden border border-app-border">
                    <div className="w-full h-full bg-gradient-to-br from-app-hover to-black flex items-center justify-center">
                       <VideoCameraIcon className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-white truncate mb-0.5 group-hover:text-text-accent transition-colors">Asset_Sequence_00{i}.mp4</div>
                    <div className="text-[10px] text-text-muted font-medium uppercase tracking-tight">8.4k views • 92% completion</div>
                  </div>
                  <ArrowUpRightIcon className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}