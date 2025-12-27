// myg/frontend/src/components/modals/NewProject.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, SparklesIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { api, endpoints } from "@/lib/api";

interface NewProjectProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#14b8a6"];
const EMOJIS = ["📁", "🎬", "🎮", "🎨", "🎵", "📸", "🚀", "✨", "🔥", "🌌"];

export default function NewProject({ isOpen, onClose, initialData }: NewProjectProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log("[Modal] Opening with initialData:", initialData);
      if (initialData) {
        setTitle(initialData.title);
        setDesc(initialData.description || "");
        setPlatform(initialData.platform || "YouTube");
        setSelectedColor(initialData.color_code || COLORS[0]);
        setSelectedEmoji(initialData.emoji || EMOJIS[0]);
      } else {
        setTitle(""); setDesc(""); setPlatform("YouTube"); setSelectedColor(COLORS[0]); setSelectedEmoji(EMOJIS[0]);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    console.log("[Modal] Attempting to save...");
    if (!title) return alert("Title is required!");
    setLoading(true);
    
    const payload = {
        title, description: desc, platform, color_code: selectedColor, emoji: selectedEmoji
    };

    try {
      if (initialData) {
        console.log(`[Modal] Calling PUT for project ${initialData.id}`);
        await api.put(endpoints.updateProject(initialData.id), payload);
      } else {
        console.log("[Modal] Calling POST for new project");
        await api.post(endpoints.createProject, payload);
      }
      onClose();
    } catch (error) {
      console.error("[Modal] Save Error:", error);
      alert("Error saving project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-editor shadow-premium overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center px-8 py-6 border-b border-app-border bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-text-accent/10 rounded-md"><SparklesIcon className="w-5 h-5 text-text-accent" /></div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{initialData ? "Edit Project" : "Create Project"}</h2>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Workspace Configuration</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-app-hover rounded-editor text-text-muted hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 outline-none" />
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Emoji Identity</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-app-input border border-app-border rounded-editor">
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => setSelectedEmoji(e)} className={`text-2xl p-2 rounded-md transition-all ${selectedEmoji === e ? 'bg-white/10 scale-110 shadow-glow' : 'opacity-40 hover:opacity-100'}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Platform</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white outline-none">
                        <option value="YouTube">YouTube</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Instagram">Instagram</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Theme</label>
                      <div className="flex items-center gap-2 h-[46px] px-3 bg-app-input border border-app-border rounded-editor">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 rounded-full transition-transform hover:scale-125 ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-app-input' : ''}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Description</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full bg-app-input border border-app-border rounded-editor p-3 text-[13px] text-white focus:border-text-accent/50 outline-none resize-none" />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-black/20 border-t border-app-border flex justify-end gap-3">
              <button onClick={onClose} className="px-6 py-2 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white">Dismiss</button>
              <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-editor hover:bg-gray-200 disabled:opacity-50 transition-premium shadow-glow">
                {loading ? "Saving..." : initialData ? "Update Project" : "Create Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}