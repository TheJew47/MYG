"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ChevronDownIcon, PhotoIcon, MusicalNoteIcon, 
  ArrowLeftIcon, DocumentTextIcon, 
  ChatBubbleBottomCenterTextIcon, ArrowDownTrayIcon, SparklesIcon, 
  PaintBrushIcon, PlayIcon, ArrowsPointingOutIcon, XMarkIcon
} from "@heroicons/react/24/outline";
import { api, uploadApi, endpoints } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// --- CONSTANTS ---
const RESOLUTIONS = [
    { label: "1080x1920 (9:16)", w: 1080, h: 1920 },
    { label: "1920x1080 (16:9)", w: 1920, h: 1080 },
    { label: "1080x1080 (1:1)", w: 1080, h: 1080 }
];

const DURATIONS = [
    "15 Seconds", "30 Seconds", "60 Seconds"
];

const FONTS = [
    "Liberation-Sans-Bold", 
    "Liberation-Serif-Bold", 
    "DejaVu-Sans-Bold", 
    "Arial-Bold", 
    "Verdana-Bold"
];

const AccordionItem = ({ title, icon: Icon, isOpen, onClick, children, hasError }: any) => (
  <div className={`border-b ${hasError ? 'border-text-error/50 bg-text-error/5' : 'border-app-border'} transition-colors`}>
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 text-text-muted hover:text-white hover:bg-app-hover transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${hasError ? 'text-text-error' : 'text-text-muted'}`} />
        <span className={`font-bold text-sm ${hasError ? 'text-text-error' : ''}`}>{title}</span>
      </div>
      <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-app-input/30"
        >
            <div className="p-5 space-y-5">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function CreateVideoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingTaskId = searchParams.get("taskId");
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ details: true });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Core Fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [script, setScript] = useState("");
  const [targetDuration, setTargetDuration] = useState("30 Seconds");
  
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Visuals
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [bgColor, setBgColor] = useState<string>("#000000"); 
  const [bgType, setBgType] = useState<"upload" | "solid">("upload");
  const [vignetteIntensity, setVignetteIntensity] = useState(0);
  const [generateImages, setGenerateImages] = useState(true);
  
  const [localBgPreview, setLocalBgPreview] = useState<string | null>(null);
  const [isBgVideo, setIsBgVideo] = useState(false);

  // Audio Settings
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("af_heart");
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Captions
  const [capEnabled, setCapEnabled] = useState(true);
  const [capFont, setCapFont] = useState("Liberation-Sans-Bold");
  const [capSize, setCapSize] = useState(80);
  const [capColor, setCapColor] = useState("yellow");
  
  // New: X/Y Positioning
  const [capY, setCapY] = useState(1300);
  const [capX, setCapX] = useState<number | "center">("center"); 
  const [capWords, setCapWords] = useState(1);

  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [keepBgAudio, setKeepBgAudio] = useState(false);
  
  const [uploadedFiles, setUploadedFiles] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const bgInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
      api.get(endpoints.getVoices).then(res => setVoices(res.data)).catch(console.error);
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isError = (val: string) => attemptedSubmit && !val;
  
  const isBgError = () => {
    if (!attemptedSubmit) return false;
    if (bgType === 'upload' && !uploadedFiles["Background"]) return true;
    return false;
  };

  const handleResChange = (e: any) => {
      const r = JSON.parse(e.target.value);
      setResolution(r);
      // Reset X/Y defaults based on new resolution
      setCapX(r.w / 2);
      setCapY(r.h * 0.7); 
  };

  const handlePreviewAudio = async () => {
      setPreviewLoading(true);
      try {
          const res = await api.post(endpoints.previewAudio, {
              text: `Hey! I am ${voices.find(v => v.id === selectedVoice)?.name || 'this voice'}. Nice to meet you!`, 
              voice: selectedVoice,
              speed: audioSpeed
          });
          const audio = new Audio(res.data.url);
          audio.play();
      } catch (e) {
          alert("Failed to generate preview");
      } finally {
          setPreviewLoading(false);
      }
  };

  const handleGenerateScript = async () => {
      if (!title) return alert("Please enter a Video Title first.");
      setIsGeneratingScript(true);
      
      try {
          const res = await api.post("/api/ai/generate_script", { 
              topic: title,
              duration: targetDuration // Pass duration to backend
          });
          setScript(res.data.script);
      } catch (e: any) { 
          console.error("Script Gen Error:", e);
          const errorMsg = e.response?.data?.detail || "Failed to generate script.";
          alert(`Error: ${errorMsg}`);
      } finally { 
          setIsGeneratingScript(false); 
      }
  };
  
  const handleCreate = async () => {
    setAttemptedSubmit(true);
    
    if (!title || !script || isBgError()) {
        return alert("Please fill in the required red fields.");
    }

    setLoading(true);
    try {
      const payload = {
        project_id: parseInt(params.id),
        title,
        description: desc,
        scripts: script,
        resolution: `${resolution.w}x${resolution.h}`, // Updated logic
        
        background_color: bgType === 'solid' ? bgColor : null,
        no_captions: !capEnabled,
        no_tts: !ttsEnabled,
        keep_background_audio: keepBgAudio,
        generate_images: generateImages, 
        
        voice: selectedVoice,
        audio_speed: audioSpeed,
        vignette_intensity: vignetteIntensity,

        files: {
            "Background": bgType === 'upload' ? uploadedFiles["Background"] : null,
            "Foreground": uploadedFiles["Foreground"],
            "Audio Track": uploadedFiles["Audio Track"]
        },
        
        captions: {
            font: capFont,
            size: capSize,
            color: capColor,
            y_pos: capY,
            x_pos: capX === "center" ? "center" : Math.floor(capX),
            words_per_screen: capWords
        }
      };

      const res = await api.post(endpoints.createTask, payload);
      router.replace(`/projects/${params.id}/create?taskId=${res.data.task_id}`);
      startPolling(res.data.task_id);
    } catch (error) {
      alert("Failed to start task.");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (taskId: number) => {
    setStatus("Processing");
    const interval = setInterval(async () => {
       try {
         const res = await api.get(`/api/tasks/${taskId}`);
         const t = res.data;
         setProgress(t.progress || 0);
         if (t.progress < 20) setStatusMsg("Brainstorming Script...");
         else if (t.progress < 40) setStatusMsg("Generating Audio...");
         else if (t.progress < 80) setStatusMsg("Editing Video & Captions...");
         else setStatusMsg("Finalizing Render...");

         if (t.status === "Completed") {
             setStatus("Completed");
             setVideoUrl(t.video_url);
             setProgress(100);
             clearInterval(interval);
         } else if (t.status === "Failed") {
             setStatus("Failed");
             clearInterval(interval);
         }
       } catch (e) { clearInterval(interval); }
    }, 1000);
  };

  const handleUpload = async (e: any, type: string) => {
      const file = e.target.files?.[0]; if(!file) return;
      
      if (type === "Background") {
          const objectUrl = URL.createObjectURL(file);
          setLocalBgPreview(objectUrl);
          setIsBgVideo(file.type.startsWith("video/"));
      }

      setIsUploading(true);
      const fd = new FormData(); fd.append("file", file);
      try {
          const res = await uploadApi.post(endpoints.uploadFile, fd);
          setUploadedFiles((p:any) => ({...p, [type]: res.data.path}));
      } catch(e) { alert("Upload Error"); }
      finally { setIsUploading(false); }
  };

  useEffect(() => {
    if (existingTaskId) {
      const fetchTask = async () => {
        try {
            const res = await api.get(`/api/tasks/${existingTaskId}`);
            const t = res.data;
            setTitle(t.title); setScript(t.script); setStatus(t.status); setVideoUrl(t.video_url); setProgress(t.progress || 0);
            if(t.captions) { 
                setCapSize(t.captions.size); 
                setCapColor(t.captions.color); 
                setCapY(t.captions.y_pos); 
                setCapWords(t.captions.words_per_screen);
                if(t.captions.font) setCapFont(t.captions.font);
                // We assume x_pos might not exist in old tasks
            }
            if(t.generate_images !== undefined) setGenerateImages(t.generate_images);
            
            if (t.status === "Processing") startPolling(t.id);
            if (t.status === "Completed") setProgress(100);
        } catch (e) { console.error(e); }
      };
      fetchTask();
    }
  }, [existingTaskId]);

  const previewCaption = useMemo(() => {
      const wordPool = ["Create", "Design", "Visual", "Render", "Studio", "Action", "Camera", "Effect", "Motion", "Stream"];
      const words = [];
      for (let i = 0; i < capWords; i++) {
          const randomIndex = Math.floor(Math.random() * wordPool.length);
          words.push(wordPool[randomIndex]);
      }
      return words.join(" ");
  }, [capWords]);

  return (
    <div className="h-full flex bg-app-bg text-text-main font-sans">
      
      <AnimatePresence>
        {isScriptModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-3xl bg-app-card border border-app-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
                >
                    <div className="flex justify-between items-center p-4 border-b border-app-border bg-app-bg">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <DocumentTextIcon className="w-5 h-5 text-blue-500"/> Edit Script
                        </h3>
                        <button onClick={() => setIsScriptModalOpen(false)} className="p-2 hover:bg-app-hover rounded-full transition-colors text-text-muted hover:text-white">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 p-0">
                        <textarea 
                            value={script} 
                            onChange={(e) => setScript(e.target.value)} 
                            className="w-full h-[60vh] bg-app-input p-6 text-lg text-white resize-none focus:outline-none font-medium leading-relaxed"
                            placeholder="Write your masterpiece here..."
                        />
                    </div>
                    <div className="p-4 border-t border-app-border bg-app-bg flex justify-end">
                        <button 
                            onClick={() => setIsScriptModalOpen(false)}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <div className="w-[450px] border-r border-app-border flex flex-col bg-app-bg/50 backdrop-blur-lg h-screen overflow-y-auto flex-shrink-0">
         <div className="p-6 border-b border-app-border flex flex-col gap-4 sticky top-0 bg-app-bg/95 z-10">
           <div className="flex items-center gap-4">
               <button onClick={() => router.push(`/projects/${params.id}`)} className="bg-app-input hover:bg-app-hover p-2 rounded-lg"><ArrowLeftIcon className="w-5 h-5"/></button>
               <h1 className="text-xl font-bold">Video Studio</h1>
           </div>
           
           <div className="space-y-1">
               <label className="text-[10px] font-bold text-text-muted uppercase">Output Resolution</label>
               <div className="relative">
                   <select 
                       value={JSON.stringify(resolution)} 
                       onChange={handleResChange} 
                       className="w-full bg-app-input border border-app-border rounded-lg p-2 text-sm appearance-none outline-none focus:border-blue-500"
                   >
                       {RESOLUTIONS.map((r) => (
                           <option key={r.label} value={JSON.stringify(r)}>{r.label}</option>
                       ))}
                   </select>
                   <ChevronDownIcon className="w-4 h-4 absolute right-3 top-3 text-text-muted pointer-events-none"/>
               </div>
           </div>
         </div>

         <AccordionItem title="Script & Concept" icon={DocumentTextIcon} isOpen={openSections["details"]} onClick={() => toggleSection("details")} hasError={isError(title) || isError(script)}>
             <div className="space-y-4">
                <div className={`border rounded-lg p-3 ${isError(title) ? 'border-text-error' : 'border-app-border'}`}>
                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Video Title (Topic)</label>
                    <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Food Facts" className="w-full bg-transparent outline-none text-sm" />
                </div>

                {/* Duration Picker */}
                <div className="border border-app-border rounded-lg p-3">
                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">Estimated Length</label>
                    <div className="flex bg-app-input rounded-md p-1 gap-1">
                        {DURATIONS.map((d) => (
                            <button 
                                key={d} 
                                onClick={() => setTargetDuration(d)}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-colors ${targetDuration === d ? 'bg-app-card text-white shadow' : 'text-text-muted hover:text-white'}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`border rounded-lg p-3 ${isError(script) ? 'border-text-error' : 'border-app-border'} relative group`}>
                     <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold text-text-muted uppercase">Script</label>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleGenerateScript} 
                                disabled={isGeneratingScript}
                                className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                            >
                                <SparklesIcon className={`w-3 h-3 ${isGeneratingScript ? 'animate-spin' : ''}`}/> 
                                {isGeneratingScript ? "Writing..." : "Generate"}
                            </button>
                            <button 
                                onClick={() => setIsScriptModalOpen(true)}
                                className="text-xs text-text-muted hover:text-white flex items-center gap-1"
                                title="Expand Editor"
                            >
                                <ArrowsPointingOutIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    </div>
                    <textarea 
                        value={script} 
                        onChange={e=>setScript(e.target.value)} 
                        placeholder="Type script..." 
                        className="w-full bg-transparent outline-none text-sm h-32 resize-none" 
                    />
                </div>
             </div>
         </AccordionItem>

         <AccordionItem title="Audio" icon={MusicalNoteIcon} isOpen={openSections["audio"]} onClick={() => toggleSection("audio")}>
             <div className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">Enable TTS</span>
                    <input type="checkbox" checked={ttsEnabled} onChange={e => setTtsEnabled(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                 </div>

                 {ttsEnabled && (
                     <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Voice</label>
                            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-app-input border border-app-border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                {voices.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-xs font-bold text-text-muted uppercase">Speed</label>
                                <span className="text-xs text-blue-400">{audioSpeed}x</span>
                            </div>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={audioSpeed} onChange={(e) => setAudioSpeed(parseFloat(e.target.value))} className="w-full accent-blue-500" />
                        </div>

                        <button onClick={handlePreviewAudio} disabled={previewLoading} className="w-full bg-app-card border border-app-border hover:bg-app-hover py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                            {previewLoading ? <SparklesIcon className="w-4 h-4 animate-spin"/> : <PlayIcon className="w-4 h-4"/>}
                            Preview Voice
                        </button>
                     </>
                 )}
             </div>
         </AccordionItem>

         <AccordionItem title="Background" icon={PhotoIcon} isOpen={openSections["visuals"]} onClick={() => toggleSection("visuals")} hasError={isBgError()}>
             <div className="space-y-4">
                <div className="flex bg-app-input rounded-lg p-1">
                    <button onClick={() => setBgType("upload")} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${bgType==="upload" ? "bg-app-card text-white shadow" : "text-text-muted"}`}>Video/Image</button>
                    <button onClick={() => setBgType("solid")} className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${bgType==="solid" ? "bg-app-card text-white shadow" : "text-text-muted"}`}>Solid Color</button>
                </div>

                {bgType === "upload" ? (
                    <div className="space-y-3">
                        <input type="file" ref={bgInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleUpload(e, "Background")} />
                        <div onClick={() => bgInputRef.current?.click()} className={`h-32 border-2 border-dashed ${isBgError() ? 'border-text-error' : 'border-app-border'} rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors`}>
                            <PhotoIcon className="w-8 h-8 text-text-muted mb-2" />
                            <span className="text-xs font-bold text-text-muted">{uploadedFiles["Background"] ? "File Uploaded" : "Click to Upload"}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <button onClick={() => setBgColor("#000000")} className={`w-8 h-8 rounded-full border border-[#333] bg-black ${bgColor==="#000000" ? 'ring-2 ring-white' : ''}`} />
                            <button onClick={() => setBgColor("#FFFFFF")} className={`w-8 h-8 rounded-full border border-[#333] bg-white ${bgColor==="#FFFFFF" ? 'ring-2 ring-blue-500' : ''}`} />
                        </div>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner ring-1 ring-[#333] cursor-pointer group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-red-500" />
                            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => setBgColor(e.target.value)} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
                                <span className="text-white text-xs drop-shadow-md">🎨</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-text-muted uppercase">Edge Fade (Vignette)</label>
                        <span className="text-xs text-blue-400">{vignetteIntensity}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={vignetteIntensity} onChange={e=>setVignetteIntensity(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>

                <div className="pt-2 border-t border-app-border">
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-white font-bold">Generate AI Overlays</span>
                        <input type="checkbox" checked={generateImages} onChange={e=>setGenerateImages(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                    </label>
                </div>
             </div>
         </AccordionItem>

         <AccordionItem title="Captions & Style" icon={ChatBubbleBottomCenterTextIcon} isOpen={openSections["captions"]} onClick={() => toggleSection("captions")}>
            <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">Enable Captions</span>
                    <input type="checkbox" checked={capEnabled} onChange={e => setCapEnabled(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                </div>
                
                {capEnabled && (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Color</label>
                                {/* SIMPLIFIED COLOR PICKER */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCapColor("yellow")} className={`w-6 h-6 rounded bg-yellow-400 border border-[#333] ${capColor==="yellow" ? 'ring-1 ring-white' : ''}`} title="Yellow"/>
                                    <button onClick={() => setCapColor("white")} className={`w-6 h-6 rounded bg-white border border-[#333] ${capColor==="white" ? 'ring-1 ring-white' : ''}`} title="White"/>
                                    <button onClick={() => setCapColor("black")} className={`w-6 h-6 rounded bg-black border border-[#333] ${capColor==="black" ? 'ring-1 ring-white' : ''}`} title="Black"/>
                                    <div className="relative w-6 h-6 rounded overflow-hidden cursor-pointer border border-[#333]">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-red-500"/>
                                        <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" onChange={(e) => setCapColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Words/Screen</label>
                                <input type="number" value={capWords} onChange={e=>setCapWords(Number(e.target.value))} className="w-full bg-app-input border border-app-border rounded-lg p-2 text-sm" min={1} max={10} />
                            </div>
                        </div>

                        {/* FONT PICKER */}
                        <div>
                            <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Font</label>
                            <select value={capFont} onChange={(e) => setCapFont(e.target.value)} className="w-full bg-app-input border border-app-border rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500">
                                {FONTS.map(f => (
                                    <option key={f} value={f}>{f.replace(/-/g, ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase">Font Size</label>
                                <span className="text-xs text-text-muted">{capSize}px</span>
                            </div>
                            <input type="range" min="30" max="200" value={capSize} onChange={e=>setCapSize(Number(e.target.value))} className="w-full accent-blue-500" />
                        </div>

                        {/* POSITION CONTROLS */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Pos X</label>
                                <input 
                                    type="range" 
                                    min="0" max={resolution.w} 
                                    value={capX === "center" ? resolution.w / 2 : capX} 
                                    onChange={e=>setCapX(Number(e.target.value))} 
                                    className="w-full accent-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Pos Y</label>
                                <input 
                                    type="range" 
                                    min="0" max={resolution.h} 
                                    value={capY} 
                                    onChange={e=>setCapY(Number(e.target.value))} 
                                    className="w-full accent-blue-500" 
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
         </AccordionItem>
      </div>

      {/* --- RIGHT SIDE / PREVIEW --- */}
      <div className="flex-1 flex flex-col bg-app-bg relative">
         <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black/90">
            
            {status === "Completed" && videoUrl ? (
                <div className="relative group flex justify-center w-full h-full items-center">
                    <video 
                        controls playsInline src={videoUrl} 
                        style={{ aspectRatio: `${resolution.w}/${resolution.h}`, maxHeight: 'calc(100vh - 5rem)' }}
                        className="rounded-lg shadow-2xl border border-app-border" 
                    />
                    <a href={`${videoUrl}/download`} download className="absolute top-4 right-4 bg-white/90 text-black p-3 rounded-full hover:scale-110 transition-transform">
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </a>
                </div>
            ) : (
                <div className="relative shadow-2xl border border-app-border overflow-hidden flex-shrink-0"
                     style={{ 
                         aspectRatio: `${resolution.w}/${resolution.h}`, 
                         height: resolution.w > resolution.h ? 'auto' : '100%', 
                         width: resolution.w > resolution.h ? '100%' : 'auto',
                         maxHeight: 'calc(100vh - 5rem)',
                         maxWidth: '100%',
                         backgroundColor: bgType === 'solid' ? bgColor : '#111',
                         backgroundImage: bgType === 'upload' && localBgPreview && !isBgVideo ? `url(${localBgPreview})` : 'none',
                         backgroundSize: 'cover',
                         backgroundPosition: 'center'
                     }}
                >
                    {bgType === 'upload' && localBgPreview && isBgVideo && (
                        <video 
                            src={localBgPreview}
                            autoPlay loop muted playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {vignetteIntensity > 0 && (
                        <div className="absolute inset-0 pointer-events-none z-10"
                             style={{ background: `radial-gradient(circle, transparent 30%, rgba(0,0,0,${vignetteIntensity / 100}))` }} 
                        />
                    )}

                    {capEnabled && (
                        <div className="absolute px-4 z-20 pointer-events-none whitespace-pre-wrap"
                             style={{ 
                                 // Center the text box on the coordinates using transform
                                 left: capX === "center" ? '50%' : `${(capX / resolution.w) * 100}%`,
                                 top: `${(capY / resolution.h) * 100}%`,
                                 transform: 'translate(-50%, -50%)',
                                 
                                 color: capColor,
                                 fontSize: `${(capSize / resolution.h) * 50}vh`, 
                                 fontFamily: capFont, 
                                 textAlign: 'center',
                                 width: '80%' // Visual Match for backend
                             }}
                        >
                            {previewCaption}
                        </div>
                    )}

                    {status === "Processing" && (
                        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center">
                            <h3 className="text-3xl font-bold text-white mb-4">{progress}%</h3>
                            <div className="w-1/2 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-blue-500" animate={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-blue-400 font-mono text-sm mt-4 animate-pulse">{statusMsg}</p>
                        </div>
                    )}
                </div>
            )}
         </div>

         <div className="h-20 border-t border-app-border bg-app-card flex items-center justify-between px-8">
             <div className="flex items-center gap-4">
                {status === "Completed" && (
                    <button onClick={handleCreate} className="text-text-muted hover:text-white text-sm font-bold flex items-center gap-2">
                        <PaintBrushIcon className="w-4 h-4"/> Regenerate
                    </button>
                )}
             </div>
             <button 
                onClick={handleCreate} 
                disabled={loading || status === "Processing"}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all"
             >
                {loading ? "Starting..." : (status === "Completed" ? "Create New" : "Generate Video")}
             </button>
         </div>
      </div>
    </div>
  );
}