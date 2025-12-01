"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { api, endpoints } from "@/lib/api";

interface NewProjectProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ["#5D6D7E", "#566573", "#7FB3D5", "#76D7C4", "#F7DC6F", "#F1948A", "#BB8FCE", "#82E0AA"];

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          {/* Updated background color here */}
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-app-card border border-app-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-app-border bg-app-bg">
              <h2 className="text-2xl font-bold text-[#E0E0E0] font-sans">Create New Project</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-8 flex gap-10 overflow-y-auto flex-1">
              <div className="flex-1 flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#E0E0E0]">Project Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gym Motivation Shorts" className="w-full bg-app-input border border-app-border rounded-lg p-3 text-white focus:border-[#777] focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#E0E0E0]">Description</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Project description..." rows={3} className="w-full bg-app-input border border-app-border rounded-lg p-3 text-white focus:border-[#777] focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#E0E0E0]">Platform</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-app-input border border-app-border rounded-lg p-3 text-white focus:border-[#777] focus:outline-none">
                      <option value="">— Select Platform —</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                    </select>
                  </div>
                  <AnimatePresence>
                    {platform && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                        <label className="text-sm font-bold text-[#E0E0E0]"><span>{platform} API Key</span></label>
                        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={`Paste your ${platform} API Key here...`} className="w-full bg-app-input border border-yellow-600/50 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="w-80 flex flex-col gap-8 border-l border-app-border pl-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-[#E0E0E0]">Brand Color</label>
                  <div className="grid grid-cols-4 gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)} className={`w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 ${selectedColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-app-card' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-app-bg border-t border-app-border flex justify-end gap-4">
              <button onClick={onClose} className="px-6 py-2 text-gray-300 hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-8 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50">
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}