"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon, 
  ArrowLeftIcon,
  UserPlusIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  MusicalNoteIcon,
  ChatBubbleBottomCenterTextIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  Square2StackIcon,
  PlayIcon,
  PauseIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { api, endpoints } from "@/lib/api";

// --- SUB-COMPONENT: MINI AUDIO PLAYER ---
const AudioPlayer = ({ 
  url, 
  isPlaying, 
  onTogglePlay, 
  audioRef, 
  onDeselect, 
  label 
}: { 
  url: string, 
  isPlaying: boolean, 
  onTogglePlay: () => void, 
  audioRef: React.RefObject<HTMLAudioElement>,
  onDeselect: () => void,
  label: string
}) => {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="relative mt-2 p-3 bg-[#1A1A1A] border border-white/5 rounded-lg overflow-hidden group/player"
    >
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button 
              onClick={onTogglePlay}
              className="p-1.5 bg-text-accent/10 rounded-full text-text-accent hover:bg-text-accent hover:text-white transition-all shrink-0"
            >
              {isPlaying ? <PauseIcon className="w-3 h-3 fill-current" /> : <PlayIcon className="w-3 h-3 fill-current" />}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 truncate" title={label}>
              {label}
            </span>
          </div>
          <button onClick={onDeselect} className="text-white/20 hover:text-white transition-colors shrink-0 ml-2">
            <XMarkIcon className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-white/40 tabular-nums">{formatTime(progress)}</span>
          <input 
            type="range" min="0" max={duration || 0} step="0.01" value={progress} onChange={handleSeek}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-text-accent"
          />
          <span className="text-[9px] font-mono text-white/40 tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-white/[0.02]">
          {volume === 0 ? <SpeakerXMarkIcon className="w-3 h-3 text-white/20" /> : <SpeakerWaveIcon className="w-3 h-3 text-white/20" />}
          <input 
            type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolume}
            className="w-20 h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white/40"
          />
          <span className="text-[9px] font-mono text-white/30 w-8">{Math.round(volume * 100)}%</span>
        </div>
      </div>
      <audio ref={audioRef} src={url} onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onEnded={() => onTogglePlay()} className="hidden" />
    </motion.div>
  );
};

interface EngineSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (config: any) => void;
  initialTitle: string; 
  initialPrompt: string;
  projectId?: number; // ADDED: Allow passing project ID
}

export default function EngineSetupModal({ isOpen, onClose, onLaunch, initialTitle, initialPrompt, projectId }: EngineSetupModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false); 

  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedBgm, setSelectedBgm] = useState<File | null>(null);
  const [bgmUrl, setBgmUrl] = useState<string | null>(null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isScriptView, setIsScriptView] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setPrompt(initialPrompt || ""); 
      setShowErrors(false);
    }
  }, [isOpen, initialTitle, initialPrompt]);

  /**
   * BACKEND LINKING: UPLOAD HELPER
   */
  const uploadToS3 = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("File upload failed");
    return await response.json(); 
  };

  /**
   * PROCEED HANDLER: LINKS TO BACKEND TASK PIPELINE
   */
  const handleProceed = async () => {
    // 1. Validate Mandatory Fields
    const isTitleValid = title.trim().length > 0;
    const isPromptValid = prompt.trim().length > 0;
    const isVoiceValid = selectedAudio !== null;

    if (!isTitleValid || !isPromptValid || !isVoiceValid) {
      setShowErrors(true);
      return;
    }

    setIsLaunching(true);

    try {
      // 2. Upload mandatory voice clone sample
      const voiceUpload = await uploadToS3(selectedAudio!);
      
      // 3. Optional uploads
      let bgmPath = null;
      if (selectedBgm) {
        const upload = await uploadToS3(selectedBgm);
        bgmPath = upload.path;
      }

      // 4. Construct Task Payload
      const payload = {
        title: title,
        scripts: prompt,
        resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "9:16" ? "1080x1920" : "1080x1080",
        // MODIFIED: Use the passed projectId prop, or null if not provided
        project_id: projectId || null, 
        generate_audio: true,
        generate_video: true,
        generate_script: false,
        files: {
          "Audio Track": voiceUpload.path, 
          "Background": bgmPath
        },
        captions: captionsEnabled ? { words_per_screen: 1 } : null
      };

      // 5. Trigger the Engine Pipeline
      const response = await fetch("http://localhost:8000/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to queue generation task");
      const data = await response.json();

      // 6. Pass Task ID back to CreatePage for polling
      onLaunch({ 
        ...payload, 
        taskId: data.task_id,
        aspectRatio: aspectRatio 
      });

    } catch (err) {
      console.error("Launch Error:", err);
      alert("Could not start generation. Check if backend is running.");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!title.trim() && !prompt.trim()) return;
    setIsGenerating(true);
    try {
        const response = await api.post(endpoints.generateScript, { topic: `Title: ${title}\nInstructions: ${prompt}`.trim(), duration: "15 Seconds" });
        if (response.data?.script) { setPrompt(response.data.script); setIsScriptView(true); }
    } catch (err) { console.error(err); } 
    finally { setIsGenerating(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
          
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-5xl h-[85vh] bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col" >
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white tracking-tight">Engine Setup</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"><XMarkIcon className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase tracking-widest px-1 transition-colors ${!title.trim() && showErrors ? 'text-red-500' : 'text-white/30'}`}>Production Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter project title..." className={`w-full bg-[#1A1A1A] border rounded-lg p-4 text-sm text-white focus:border-white/20 outline-none transition-all ${!title.trim() && showErrors ? 'border-red-500' : 'border-white/10'}`} />
              </div>

              <div className="relative group/box h-64">
                <motion.div 
                  layoutId="script-box"
                  className={`absolute inset-0 bg-[#1A1A1A] border rounded-lg overflow-hidden flex flex-col transition-all ${!prompt.trim() && showErrors ? 'border-red-500' : 'border-white/10'}`}
                >
                  <div className="absolute top-3 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                     <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!prompt.trim() && showErrors ? 'text-red-500' : 'text-white/20'}`}>
                        {isScriptView ? "Script Content" : "Objective"}
                     </span>
                     <div className="flex items-center gap-2 pointer-events-auto">
                        <button onClick={handleGenerateScript} className="px-2 py-1 bg-text-accent/10 border border-text-accent/30 rounded-full text-[8px] font-black uppercase tracking-widest text-text-accent hover:bg-text-accent hover:text-white transition-all">
                           {isGenerating ? <SparklesIcon className="w-3 h-3 animate-spin" /> : "AI Generate"}
                        </button>
                        <button onClick={() => setIsDetached(true)} className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/40 transition-colors"><ArrowsPointingOutIcon className="w-3 h-3" /></button>
                     </div>
                  </div>
                  <textarea 
                    value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Instructions..." 
                    className="w-full h-full bg-transparent p-6 pt-12 text-sm text-white focus:outline-none resize-none custom-scrollbar" 
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => !selectedImage && imageInputRef.current?.click()} className="relative flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-lg p-3.5 hover:bg-white/5 transition-all">
                    <div className="p-1.5 bg-white/5 rounded w-8 h-8 flex items-center justify-center overflow-hidden">
                        {imageUrl ? <img src={imageUrl} className="w-full h-full object-cover" /> : <UserPlusIcon className="w-4 h-4 text-white/40" />}
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest text-white">AI Avatar</span>
                    <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImageUrl(URL.createObjectURL(file)); setSelectedImage(file); } }} />
                </button>
                
                <div className="space-y-2">
                    <button onClick={() => !selectedAudio && audioInputRef.current?.click()} className={`w-full relative flex items-center gap-3 bg-[#1A1A1A] border rounded-lg p-3.5 hover:bg-white/5 transition-all ${!selectedAudio && showErrors ? 'border-red-500' : 'border-white/10'}`}>
                        <div className="p-1.5 bg-white/5 rounded shrink-0"><SpeakerWaveIcon className={`w-4 h-4 ${!selectedAudio && showErrors ? 'text-red-500' : 'text-white/40'}`} /></div>
                        <span className={`font-bold text-xs uppercase tracking-widest ${!selectedAudio && showErrors ? 'text-red-500' : 'text-white'}`}>Clone Voice</span>
                        <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setAudioUrl(URL.createObjectURL(file)); setSelectedAudio(file); setIsPlaying(true); setTimeout(() => audioRef.current?.play(), 50); } }} />
                    </button>
                    {audioUrl && <AudioPlayer url={audioUrl} isPlaying={isPlaying} onTogglePlay={() => { isPlaying ? audioRef.current?.pause() : audioRef.current?.play(); setIsPlaying(!isPlaying); }} audioRef={audioRef} onDeselect={() => { setSelectedAudio(null); setAudioUrl(null); }} label={selectedAudio?.name || "Voice Sample"} />}
                </div>

                <button onClick={() => setCaptionsEnabled(!captionsEnabled)} className={`w-full flex items-center gap-3 bg-[#1A1A1A] border ${captionsEnabled ? 'border-text-accent' : 'border-white/10'} rounded-lg p-3.5 hover:bg-white/5 transition-all`}>
                    <div className={`p-1.5 ${captionsEnabled ? 'bg-text-accent/20' : 'bg-white/5'} rounded shrink-0`}><ChatBubbleBottomCenterTextIcon className={`w-4 h-4 ${captionsEnabled ? 'text-text-accent' : 'text-white/40'}`} /></div>
                    <span className="font-bold text-xs uppercase tracking-widest text-white">Captions</span>
                </button>

                <div className="space-y-2">
                    <button onClick={() => !selectedBgm && bgmInputRef.current?.click()} className="w-full relative flex items-center gap-3 bg-[#1A1A1A] border border-white/10 rounded-lg p-3.5 hover:bg-white/5 transition-all">
                        <div className="p-1.5 bg-white/5 rounded shrink-0"><MusicalNoteIcon className="w-4 h-4 text-white/40" /></div>
                        <span className="font-bold text-xs uppercase tracking-widest text-white">BG Music</span>
                        <input type="file" ref={bgmInputRef} className="hidden" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setBgmUrl(URL.createObjectURL(file)); setSelectedBgm(file); setIsBgmPlaying(true); setTimeout(() => bgmAudioRef.current?.play(), 50); } }} />
                    </button>
                    {bgmUrl && <AudioPlayer url={bgmUrl} isPlaying={isBgmPlaying} onTogglePlay={() => { isBgmPlaying ? bgmAudioRef.current?.pause() : bgmAudioRef.current?.play(); setIsBgmPlaying(!isBgmPlaying); }} audioRef={bgmAudioRef} onDeselect={() => { setSelectedBgm(null); setBgmUrl(null); }} label={selectedBgm?.name || "Music"} />}
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-4">
                  {[ { id: '16:9', icon: ComputerDesktopIcon }, { id: '9:16', icon: DevicePhoneMobileIcon }, { id: '1:1', icon: Square2StackIcon } ].map((item) => (
                    <button key={item.id} onClick={() => setAspectRatio(item.id)} className={`flex items-center gap-3 bg-[#1A1A1A] border ${aspectRatio === item.id ? 'border-text-accent' : 'border-white/10'} rounded-lg p-3.5 transition-all`}>
                      <div className={`p-1.5 ${aspectRatio === item.id ? 'bg-text-accent/20' : 'bg-white/5'} rounded shrink-0`}><item.icon className={`w-4 h-4 ${aspectRatio === item.id ? 'text-text-accent' : 'text-white/40'}`} /></div>
                      <span className="font-bold text-[10px] uppercase tracking-widest text-white">{item.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#121212]">
              <button onClick={onClose} className="px-6 py-2 bg-[#1A1A1A] border border-white/10 rounded-md text-[11px] font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all"><ArrowLeftIcon className="w-3.5 h-3.5 mr-2 inline" /> Back</button>
              <button 
                onClick={handleProceed} 
                disabled={isLaunching}
                className={`px-8 py-2 bg-[#007AFF] text-white rounded-md text-[11px] font-black uppercase tracking-widest shadow-glow hover:bg-[#0063CC] transition-all flex items-center gap-2 ${isLaunching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLaunching ? (
                  <>
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    Launching...
                  </>
                ) : (
                  "Proceed"
                )}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {isDetached && (
              <motion.div 
                layoutId="script-box"
                className="fixed inset-0 z-[300] bg-[#121212] flex items-center justify-center p-8 md:p-12"
              >
                <div className="relative w-full h-full max-w-6xl bg-[#1A1A1A] border border-white/20 rounded-2xl shadow-[0_0_100px_rgba(0,122,255,0.1)] overflow-hidden">
                   <div className="absolute top-6 left-8 right-8 z-20 flex justify-between items-center pointer-events-none">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white/40">Detached Editor</span>
                        <span className="text-[9px] uppercase tracking-[0.1em] text-text-accent/60 font-medium">Focusing on Script</span>
                      </div>
                      <div className="flex items-center gap-4 pointer-events-auto">
                        <button onClick={handleGenerateScript} className="px-4 py-2 bg-text-accent/10 border border-text-accent/30 rounded-full text-[10px] font-black uppercase tracking-widest text-text-accent hover:bg-text-accent hover:text-white transition-all shadow-glow">
                           {isGenerating ? "AI GENERATING..." : "AI GENERATE SCRIPT"}
                        </button>
                        <button 
                          onClick={() => setIsDetached(false)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/60 transition-all border border-white/5 shadow-premium"
                        >
                          <ArrowsPointingInIcon className="w-5 h-5" />
                        </button>
                      </div>
                   </div>

                   <textarea 
                    value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Focus Mode: Type your script here..." 
                    className="w-full h-full bg-transparent p-12 pt-24 text-xl text-white focus:outline-none resize-none custom-scrollbar leading-relaxed" 
                   />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}