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
      className="w-full h-[180px] bg-app-card border border-app-border rounded-xl cursor-pointer hover:border-text-muted transition-colors flex flex-col overflow-hidden group"
    >
      {/* Top Visual Half */}
      <div 
        className="h-[100px] flex items-center justify-center relative"
        style={{ backgroundColor: color }}
      >
        <span className="text-5xl drop-shadow-md transform group-hover:scale-110 transition-transform duration-200">
          {emoji}
        </span>
      </div>

      {/* Bottom Detail Half */}
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-text-main font-bold truncate">{title}</h3>
        <p className="text-text-muted text-xs line-clamp-2">{description}</p>
      </div>
    </div>
  );
}