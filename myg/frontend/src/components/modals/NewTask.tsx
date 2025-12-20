"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, PhotoIcon, MusicalNoteIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { api, uploadApi, endpoints } from "@/lib/api";

interface NewTaskProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function NewTask({ isOpen, onClose, projectId }: NewTaskProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [script, setScript] = useState("");
  const [resolution, setResolution] = useState("1080x1920");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  
  // Revert: Restore Audio Toggle state
  const [keepBgAudio, setKeepBgAudio] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState({
    "Foreground": null as string | null,
    "Background": null as string | null,
    "Audio Track": null as string | null,
    "Thumbnail": null as string | null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiAll, setAiAll] = useState(false);

  const fgInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadApi.post(endpoints.uploadFile, formData);
      setUploadedFiles(prev => ({ ...prev, [type]: res.data.path }));
      alert(`${type} uploaded!`);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        project_id: parseInt(projectId),
        title: aiAll ? null : title,
        description: aiAll ? null : desc,
        scripts: aiAll ? null : script,
        resolution: resolution,
        scheduled_date: aiAll ? null : scheduleDate,
        scheduled_time: aiAll ? null : scheduleTime,
        keep_background_audio: keepBgAudio,
        files: aiAll ? {} : uploadedFiles
      };

      await api.post(endpoints.createTask, payload);
      alert("Task Started!");
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  const isVertical = resolution === "1080x1920";
  const previewStyle = isVertical 
    ? { width: "200px", height: "355px" } 
    : { width: "355px", height: "200px" };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
           
           <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-[#121212] w-full max-w-6xl h-[90vh] rounded-xl border border-[#333] flex overflow-hidden shadow-2xl">
              {/* Hidden Inputs */}
              <input type="file" ref={fgInputRef} className="hidden" accept="video/*,image/*" onChange={(e) => handleFileUpload(e, "Foreground")} />
              <input type="file" ref={bgInputRef} className="hidden" accept="video/*,image/*" onChange={(e) => handleFileUpload(e, "Background")} />
              <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, "Audio Track")} />
              <input type="file" ref={thumbInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "Thumbnail")} />

              {/* Left Column */}
              <div className="flex-1 p-8 border-r border-[#333] overflow-y-auto space-y-6 scrollbar-thin">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-white font-sans">New Task</h2>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                    <input type="checkbox" checked={aiAll} onChange={(e) => setAiAll(e.target.checked)} className="rounded bg-[#252525] border-[#444] accent-white" /> Let MYGga Decide All
                  </label>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-[#E0E0E0]">Title</label>
                   <input disabled={aiAll} value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full bg-[#1E1E1E] border border-[#333] p-3 rounded-lg text-white disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-[#E0E0E0]">Scripts</label>
                   <textarea disabled={aiAll} value={script} onChange={e => setScript(e.target.value)} placeholder="Script..." className="w-full bg-[#1E1E1E] border border-[#333] p-3 rounded-lg text-white h-32 resize-none disabled:opacity-50" />
                </div>

                {/* Assets */}
                <div className="space-y-3">
                   <div className="flex justify-between">
                     <label className="text-sm font-bold text-[#E0E0E0]">Assets</label>
                     <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                        <input type="checkbox" checked={keepBgAudio} onChange={(e) => setKeepBgAudio(e.target.checked)} className="rounded bg-[#252525] border-[#444] accent-white" /> 
                        Keep Background Audio
                     </label>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div onClick={() => !aiAll && fgInputRef.current?.click()} className={`h-24 bg-[#1E1E1E] border border-[#333] rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 cursor-pointer ${uploadedFiles["Foreground"] ? "border-green-500 text-green-500" : ""} ${aiAll ? 'opacity-50' : ''}`}>
                         <VideoCameraIcon className="w-6 h-6 mb-1"/><span className="text-xs font-bold">{uploadedFiles["Foreground"] ? "Uploaded" : "Foreground"}</span>
                      </div>
                      <div onClick={() => !aiAll && bgInputRef.current?.click()} className={`h-24 bg-[#1E1E1E] border border-[#333] rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 cursor-pointer ${uploadedFiles["Background"] ? "border-green-500 text-green-500" : ""} ${aiAll ? 'opacity-50' : ''}`}>
                         <PhotoIcon className="w-6 h-6 mb-1"/><span className="text-xs font-bold">{uploadedFiles["Background"] ? "Uploaded" : "Background"}</span>
                      </div>
                      <div onClick={() => !aiAll && audioInputRef.current?.click()} className={`h-24 bg-[#1E1E1E] border border-[#333] rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 cursor-pointer ${uploadedFiles["Audio Track"] ? "border-green-500 text-green-500" : ""} ${aiAll ? 'opacity-50' : ''}`}>
                         <MusicalNoteIcon className="w-6 h-6 mb-1"/><span className="text-xs font-bold">{uploadedFiles["Audio Track"] ? "Uploaded" : "Audio Track"}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-[400px] bg-[#181818] p-8 flex flex-col gap-6">
                 <div onClick={() => !aiAll && thumbInputRef.current?.click()} className="w-full bg-[#000] rounded-lg border border-[#333] flex items-center justify-center overflow-hidden relative group cursor-pointer" style={{ height: "400px" }}>
                    <div className="bg-[#1E1E1E] border border-[#333] flex items-center justify-center transition-all duration-500" style={previewStyle}>
                      <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">
                        {uploadedFiles["Thumbnail"] ? "Thumbnail Uploaded" : "Preview"}
                      </span>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold text-[#E0E0E0]">Resolution</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full bg-[#1E1E1E] border border-[#333] rounded p-2 text-white text-sm outline-none">
                      <option value="1080x1920">1920x1080 (9:16) — Vertical</option>
                      <option value="1920x1080">1920x1080 (16:9) — Horizontal</option>
                    </select>
                 </div>

                 <div className="mt-auto flex justify-end gap-3 pt-4 border-t border-[#333]">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancel</button>
                    <button onClick={handleSave} disabled={loading || isUploading} className="bg-white text-black px-6 py-2 rounded-md font-bold text-sm hover:bg-gray-200 disabled:opacity-50">
                      {loading ? "Creating..." : isUploading ? "Uploading..." : "Create"}
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}