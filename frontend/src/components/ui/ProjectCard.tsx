"use client";
import { FolderIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";

interface ProjectCardProps {
  title: string;
  description: string;
  color: string;
  emoji: string;
  onClick?: () => void;
}

export default function ProjectCard({ title, description, color, emoji, onClick }: ProjectCardProps) {
  return (
    <div 
      onClick={onClick}
      className="group relative w-full h-[220px] bg-app-card border border-app-border rounded-editor cursor-pointer overflow-hidden transition-premium hover:border-text-accent/30 hover:shadow-premium"
    >
      {/* Top Visual Section: Ambient Background with Emoji */}
      <div 
        className="h-[120px] w-full flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: `${color}15` }} // 15% opacity of the theme color for a subtle tint
      >
        {/* Decorative background element */}
        <div 
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          style={{ 
            background: `radial-gradient(circle at center, ${color}, transparent 70%)` 
          }}
        />
        
        <span className="text-5xl z-10 drop-shadow-2xl transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ease-out">
          {emoji}
        </span>

        {/* Action button placeholder */}
        <button 
          className="absolute top-3 right-3 p-1.5 rounded-md bg-black/20 hover:bg-black/40 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20"
          onClick={(e) => { e.stopPropagation(); /* Placeholder for menu */ }}
        >
          <EllipsisVerticalIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Content Section */}
      <div className="p-4 flex flex-col justify-between h-[100px] bg-gradient-to-b from-app-card to-black">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-3 h-3 text-text-accent" />
            <h3 className="text-[13px] font-bold text-white truncate tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Footer info: Metadata placeholder */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
           <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Modified 2h ago</span>
           <div 
             className="w-1.5 h-1.5 rounded-full" 
             style={{ backgroundColor: color }}
           />
        </div>
      </div>

      {/* Hover border glow effect */}
      <div className="absolute inset-0 border-2 border-text-accent/0 group-hover:border-text-accent/10 rounded-editor pointer-events-none transition-colors" />
    </div>
  );
}