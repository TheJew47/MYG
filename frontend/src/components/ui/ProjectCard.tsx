// myg/frontend/src/components/ui/ProjectCard.tsx
"use client";
import { Fragment } from "react";
import { FolderIcon, EllipsisVerticalIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";

interface ProjectCardProps {
  id: string | number;
  title: string;
  description: string;
  color: string;
  emoji: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProjectCard({ 
    id, title, description, color, emoji, onClick, onEdit, onDelete 
}: ProjectCardProps) {

  // Prevent card click when clicking menu items
  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    console.log(`[ProjectCard] Action triggered for project ${id}`);
    action?.();
  };

  return (
    <div 
      onClick={onClick}
      className="group relative w-full h-[220px] bg-app-card border border-app-border rounded-editor cursor-pointer overflow-hidden transition-premium hover:border-text-accent/30 hover:shadow-premium"
    >
      {/* Top Visual Section */}
      <div 
        className="h-[120px] w-full flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: `${color}15` }}
      >
        <div 
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />
        
        <span className="text-5xl z-10 drop-shadow-2xl transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 ease-out">
          {emoji}
        </span>

        {/* Action Menu */}
        <div className="absolute top-3 right-3 z-30" onClick={(e) => e.stopPropagation()}>
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button 
              className="p-1.5 rounded-md bg-black/20 hover:bg-black/40 text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-app-card border border-app-border rounded-md shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={(e) => handleAction(e, onEdit)}
                        className={`${active ? 'bg-app-hover text-white' : 'text-text-muted'} flex w-full items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors`}
                      >
                        <PencilSquareIcon className="mr-3 h-4 w-4" />
                        Edit Project
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={(e) => handleAction(e, onDelete)}
                        className={`${active ? 'bg-red-500/10 text-red-500' : 'text-red-500/70'} flex w-full items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors`}
                      >
                        <TrashIcon className="mr-3 h-4 w-4" />
                        Delete Project
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Bottom Content Section */}
      <div className="p-4 flex flex-col justify-between h-[100px] bg-gradient-to-b from-app-card to-black">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-3 h-3 text-text-accent" />
            <h3 className="text-[13px] font-bold text-white truncate tracking-tight">{title}</h3>
          </div>
          <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed font-medium">
            {description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
           <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Workspace</span>
           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}