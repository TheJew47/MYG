"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, 
  MagnifyingGlassIcon, 
  ChevronDownIcon,
  UserPlusIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";

// --- Types ---
interface Workflow {
  id: string;
  title: string;
  category: string;
  image: string;
  platforms: string[];
}

// --- Mock Data ---
const WORKFLOWS: Record<string, Workflow[]> = {
  "Trends": [
    { id: "bf-ad", title: "Black Friday Ad", category: "Trends", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400", platforms: ["yt", "tk", "ig"] },
    { id: "bf-promo", title: "Black Friday Promo", category: "Trends", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=400", platforms: ["tk", "ig"] },
    { id: "script-video", title: "Script to Video", category: "Trends", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=400", platforms: ["yt", "tk"] },
  ],
  "Top picks": [
    { id: "ugc-ad", title: "UGC Ad with human actor", category: "Top picks", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400", platforms: ["tk", "ig"] },
    { id: "short-video", title: "Short video", category: "Top picks", image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=400", platforms: ["yt", "tk", "ig"] },
    { id: "explainer", title: "Explainer video", category: "Top picks", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400", platforms: ["yt", "ig"] },
  ]
};

interface WorkflowsModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export default function WorkflowsModal({ isOpen, onDismiss }: WorkflowsModalProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // FIX: Reset selection to null whenever the modal state changes (open/close)
  useEffect(() => {
    if (!isOpen) {
      setSelectedWorkflow(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onDismiss} 
            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative w-full max-w-5xl h-[85vh] bg-[#121212] border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-app-border">
              <h2 className="text-lg font-bold text-white tracking-tight">Workflows</h2>
              <button onClick={onDismiss} className="p-1 hover:bg-app-hover rounded text-text-muted hover:text-white transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* View Logic */}
            {!selectedWorkflow ? (
              <WorkflowGrid onSelect={setSelectedWorkflow} />
            ) : (
              <WorkflowDetail workflow={selectedWorkflow} onBack={() => setSelectedWorkflow(null)} />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- SUB-VIEW: GRID ---
function WorkflowGrid({ onSelect }: { onSelect: (w: Workflow) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
      {/* Search Bar */}
      <div className="relative group max-w-full">
        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          placeholder="Search Flows" 
          className="w-full bg-[#1A1A1A] border border-app-border rounded-md py-2.5 pl-10 pr-4 text-sm text-white focus:border-text-accent/50 outline-none transition-all"
        />
      </div>

      {Object.entries(WORKFLOWS).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{category}</h3>
            <button className="text-[10px] font-bold text-text-accent hover:underline">See all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelect(item)}
                className="group relative aspect-[16/10] bg-[#1A1A1A] rounded-lg overflow-hidden cursor-pointer border border-transparent hover:border-text-accent/50 transition-all"
              >
                <img src={item.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 text-[13px] font-bold text-white leading-tight pr-4">
                  {item.title}
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1 text-[10px] text-white/60">
                  {item.platforms.map(p => <span key={p} className="uppercase font-bold tracking-tighter border border-white/20 px-1 rounded">{p}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- SUB-VIEW: DETAIL ---
function WorkflowDetail({ workflow, onBack }: { workflow: Workflow; onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col bg-[#121212]">
      {/* Visual Header */}
      <div className="h-64 w-full relative">
        <img src={workflow.image} className="w-full h-full object-cover opacity-40 grayscale" alt={workflow.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">{workflow.title}</h1>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 space-y-6 -mt-4 relative z-10">
        <div className="text-[13px] text-text-muted font-medium flex flex-wrap items-center gap-2">
          Create a 
          <span className="border-b border-white/40 pb-0.5 text-white flex items-center gap-1 cursor-pointer hover:text-text-accent transition-colors">fast-paced <ChevronDownIcon className="w-3 h-3"/></span> 
          {workflow.title} of 
          <span className="border-b border-white/40 pb-0.5 text-white flex items-center gap-1 cursor-pointer hover:text-text-accent transition-colors">15 seconds <ChevronDownIcon className="w-3 h-3"/></span> 
          for 
          <span className="border-b border-white/40 pb-0.5 text-white flex items-center gap-1 cursor-pointer hover:text-text-accent transition-colors">TikTok <ChevronDownIcon className="w-3 h-3"/></span> 
          about
        </div>

        <textarea 
          placeholder="Give me a link to your product/shop along with detailed instructions or your script"
          className="w-full bg-[#1A1A1A] border border-app-border rounded-lg p-4 text-sm text-white h-32 focus:border-text-accent/50 outline-none resize-none placeholder:text-text-muted/40"
        />

        <button className="flex items-center gap-3 w-full bg-[#1A1A1A] border border-app-border rounded-lg p-3.5 text-sm text-white hover:bg-app-hover transition-premium">
          <div className="p-1.5 bg-white/5 rounded"><UserPlusIcon className="w-4 h-4 text-text-muted" /></div>
          Hire an actor
          <PlusIconSmall />
        </button>

        <div className="space-y-4 pt-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Settings:</h4>
           <div className="flex items-center gap-2 text-sm">
             <span className="text-text-muted">1. Use</span>
             <span className="text-white border-b border-white/20 pb-0.5 flex items-center gap-1 cursor-pointer">only generated clips <ChevronDownIcon className="w-3 h-3"/></span>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-app-border flex justify-end gap-3 bg-[#121212]">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2 bg-[#1A1A1A] border border-app-border rounded-md text-[11px] font-bold uppercase tracking-widest text-white hover:bg-app-hover transition-premium"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back
        </button>
        <button className="px-8 py-2 bg-[#007AFF] text-white rounded-md text-[11px] font-black uppercase tracking-widest shadow-glow hover:bg-[#0063CC] transition-premium">
          Proceed
        </button>
      </div>
    </div>
  );
}

function PlusIconSmall() {
    return (
      <span className="ml-auto text-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
    );
}