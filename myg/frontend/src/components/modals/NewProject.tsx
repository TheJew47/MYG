"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { api, endpoints } from "@/lib/api";

interface NewProjectProps {
  isOpen: boolean;
  onClose: () => void;
}

// Refined Pro Palette
const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function NewProject({ isOpen, onClose }: NewProjectProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [platform, setPlatform] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) { setTitle(""); setDesc(""); setPlatform(""); setApiKey(""); }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title || !platform) return alert("Title and Platform are required!");
    setLoading(true);
    try {
      await api.post(endpoints.createProject, {
        title, description: desc, platform, color_code: selectedColor, emoji: "📁"
      });
      onClose();
    } catch (error) {
      alert("Error creating project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-editor shadow-premium overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-app-border bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-text-accent/10 rounded-md">
                   <SparklesIcon className="w-5 h-5 text-text-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight leading-none">Create New Project</h2>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Configure your creative workspace</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-app-hover rounded-editor text-text-muted hover:text-white transition-premium">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Project Title</label>
                      <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Cinematic Motion Graphics" 
                        className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 focus:outline-none placeholder:text-text-muted/30 transition-premium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Project Description</label>
                      <textarea 
                        value={desc} 
                        onChange={(e) => setDesc(e.target.value)} 
                        placeholder="Briefly describe the visual style and goals..." 
                        rows={3} 
                        className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 focus:outline-none resize-none placeholder:text-text-muted/30 transition-premium" 
                      />
                    </div>
                </div>

                <div className="h-px bg-app-border" />

                {/* Platform & Theme */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Destination Platform</label>
                    <div className="relative group">
                        <select 
                            value={platform} 
                            onChange={(e) => setPlatform(e.target.value)} 
                            className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 focus:outline-none appearance-none cursor-pointer transition-premium"
                        >
                            <option value="" className="bg-app-card">Select Platform</option>
                            <option value="YouTube" className="bg-app-card">YouTube</option>
                            <option value="TikTok" className="bg-app-card">TikTok</option>
                            <option value="Instagram" className="bg-app-card">Instagram</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Workspace Theme</label>
                      <div className="flex items-center gap-2 h-[46px] px-3 bg-app-input border border-app-border rounded-editor">
                        {COLORS.map(c => (
                          <button 
                            key={c} 
                            onClick={() => setSelectedColor(c)} 
                            className={`w-5 h-5 rounded-full transition-transform hover:scale-125 ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-app-input' : ''}`} 
                            style={{ backgroundColor: c }} 
                          />
                        ))}
                      </div>
                  </div>
                </div>

                <AnimatePresence>
                  {platform && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{platform} API Authentication</label>
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder={`Secure ${platform} Access Token...`} 
                        className="w-full bg-app-input border border-text-accent/20 rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 focus:outline-none transition-premium" 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-black/20 border-t border-app-border flex justify-end gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-premium"
              >
                Dismiss
              </button>
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="px-8 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-editor hover:bg-gray-200 disabled:opacity-50 transition-premium shadow-glow"
              >
                {loading ? "Initializing..." : "Launch Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}