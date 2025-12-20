"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, FilmIcon, ChevronDownIcon, ClockIcon } from "@heroicons/react/24/outline";

interface SetupEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: { fps: number; resolution: string; duration: number }) => void;
}

export default function SetupEditor({ isOpen, onClose, onConfirm }: SetupEditorProps) {
  const [fps, setFps] = useState(24);
  const [resolution, setResolution] = useState("16:9");
  const [duration, setDuration] = useState(15);

  const FRAMERATES = [24, 30, 60, 120, 144];
  const RESOLUTIONS = [
    { label: "Cinema Landscape (16:9)", value: "16:9" },
    { label: "Vertical / Social (9:16)", value: "9:16" },
    { label: "Social Square (1:1)", value: "1:1" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-app-card border border-app-border rounded-editor shadow-premium overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-app-border bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-text-accent/10 rounded-md">
                   <FilmIcon className="w-5 h-5 text-text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-none">
                    Sequence Setup
                  </h2>
                  <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.15em] mt-1">Configure output parameters</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-app-hover rounded-editor text-text-muted hover:text-white transition-premium">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Framerate Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Framerate (FPS)</label>
                <div className="grid grid-cols-5 gap-2">
                  {FRAMERATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFps(rate)}
                      className={`h-10 rounded-editor text-[11px] font-black tracking-tight border transition-premium ${
                        fps === rate
                          ? "bg-white text-black border-white shadow-glow"
                          : "bg-app-input border-app-border text-text-muted hover:border-text-accent/30 hover:text-white"
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Resolution Aspect Ratio</label>
                <div className="relative group">
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-app-input border border-app-border rounded-editor h-11 px-4 text-[13px] text-white focus:border-text-accent/50 outline-none appearance-none cursor-pointer transition-premium"
                    >
                      {RESOLUTIONS.map((res) => (
                        <option key={res.value} value={res.value} className="bg-app-card py-2">
                          {res.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Duration Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Sequence Length</label>
                    <span className="text-[10px] font-mono text-text-accent uppercase">Seconds</span>
                </div>
                <div className="relative group">
                    <ClockIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-text-accent transition-colors" />
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="w-full bg-app-input border border-app-border rounded-editor h-11 pl-11 pr-4 text-[13px] text-white font-mono focus:border-text-accent/50 outline-none transition-premium"
                    />
                </div>
                <p className="text-[9px] text-text-muted font-medium italic px-1 opacity-60">Base timeline length. This can be expanded within the editor.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-app-border bg-black/20 flex justify-end gap-3">
              <button 
                onClick={onClose} 
                className="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-premium"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm({ fps, resolution, duration })}
                className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-editor text-[11px] font-black uppercase tracking-widest transition-premium shadow-glow"
              >
                Initialize Editor
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}