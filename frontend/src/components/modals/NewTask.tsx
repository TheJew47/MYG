// myg/frontend/src/components/modals/NewTask.tsx
"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    PhotoIcon, VideoCameraIcon, 
    SparklesIcon, DocumentTextIcon, SpeakerWaveIcon,
    ChevronUpIcon, CheckIcon
} from "@heroicons/react/24/outline";
import { api, uploadApi, endpoints } from "@/lib/api";

type OutputType = 'video' | 'audio' | 'script' | 'image';

interface NewTaskProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function NewTask({ isOpen, onClose, projectId }: NewTaskProps) {
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State for the Output Type and the Dropdown visibility
  const [outputType, setOutputType] = useState<OutputType>('video');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState({
    "Foreground": null as string | null,
    "Background": null as string | null,
    "Audio Track": null as string | null,
  });

  const fgRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const pipelineConfig = {
    video: { id: 'video', label: 'AI Video', icon: VideoCameraIcon, color: 'text-red-400', desc: 'Script • Audio • Video' },
    audio: { id: 'audio', label: 'Voiceover', icon: SpeakerWaveIcon, color: 'text-purple-400', desc: 'Script • Narration' },
    script: { id: 'script', label: 'Screenplay', icon: DocumentTextIcon, color: 'text-blue-400', desc: 'Text Generation Only' },
    image: { id: 'image', label: 'Cover Art', icon: PhotoIcon, color: 'text-green-400', desc: 'Single Image Gen' }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadApi.post(endpoints.uploadFile, formData);
      setUploadedFiles(prev => ({ ...prev, [type]: res.data.path }));
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!title) return alert("Enter a topic.");
    setLoading(true);

    const isManualScript = script.length > 0;
    
    try {
      await api.post(endpoints.createTask, {
        project_id: parseInt(projectId),
        title,
        scripts: isManualScript ? script : "",
        // Logic: If manual script provided, don't generate one.
        // Otherwise, generate script for Video, Audio, and Script modes.
        generate_script: !isManualScript && ['video', 'audio', 'script'].includes(outputType),
        generate_audio: ['video', 'audio'].includes(outputType),
        generate_video: outputType === 'video',
        generate_images: outputType === 'image',
        files: uploadedFiles
      });
      onClose();
    } catch (e) { alert("Pipeline failed."); } finally { setLoading(false); }
  };

  const CurrentIcon = pipelineConfig[outputType].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-[#0A0A0A] w-full max-w-6xl h-[85vh] rounded-[40px] border border-white/10 flex overflow-hidden shadow-2xl">
            
            <input type="file" ref={fgRef} className="hidden" onChange={e => handleFileUpload(e, "Foreground")} />
            <input type="file" ref={bgRef} className="hidden" onChange={e => handleFileUpload(e, "Background")} />
            <input type="file" ref={audioRef} className="hidden" onChange={e => handleFileUpload(e, "Audio Track")} />

            {/* Left Panel: Content & Configuration */}
            <div className="flex-1 p-12 overflow-y-auto space-y-12 custom-scrollbar">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-text-accent/10 rounded-2xl flex items-center justify-center border border-text-accent/20">
                    <SparklesIcon className="w-6 h-6 text-text-accent" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Loom Engine</h2>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Project Objective</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Explain the concept of Neural Networks..." className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl text-xl text-white focus:border-text-accent outline-none transition-all placeholder:text-white/10" />
              </div>

              {/* OUTPUT MODE SELECTOR */}
              <div className="space-y-6 relative z-50">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Output Mode</label>
                
                <div className="relative">
                    {/* The Dropdown Menu (Appears Above) */}
                    <AnimatePresence>
                        {isSelectorOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: -16, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                className="absolute bottom-full left-0 right-0 bg-[#1A1A1A] border border-white/10 rounded-[30px] p-2 shadow-2xl overflow-hidden mb-2"
                            >
                                {Object.values(pipelineConfig).map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setOutputType(option.id as OutputType); setIsSelectorOpen(false); }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${outputType === option.id ? 'bg-white text-black' : 'hover:bg-white/5 text-white/60'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${outputType === option.id ? 'bg-black/10 text-black' : 'bg-white/5 text-white/40'}`}>
                                            <option.icon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-xs font-black uppercase tracking-widest leading-none">{option.label}</p>
                                            <p className={`text-[10px] mt-1 ${outputType === option.id ? 'text-black/60' : 'text-white/20'}`}>{option.desc}</p>
                                        </div>
                                        {outputType === option.id && <CheckIcon className="w-5 h-5 mr-2" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* The Trigger Button */}
                    <button
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className={`w-full flex items-center justify-between p-8 rounded-[40px] border transition-all group relative ${isSelectorOpen ? 'border-text-accent bg-text-accent/5' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center bg-[#111] border border-white/5 ${pipelineConfig[outputType].color}`}>
                                <CurrentIcon className="w-8 h-8" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{pipelineConfig[outputType].label}</h3>
                                <p className="text-sm font-bold text-white/40 mt-1">{pipelineConfig[outputType].desc}</p>
                            </div>
                        </div>
                        
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${isSelectorOpen ? 'bg-text-accent text-black border-text-accent' : 'bg-black/40 border-white/5 text-white/40 group-hover:text-white group-hover:border-white/20'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{isSelectorOpen ? 'Select Mode' : 'Change Mode'}</span>
                            <ChevronUpIcon className={`w-4 h-4 transition-transform duration-300 ${isSelectorOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                </div>
              </div>

              {/* Optional Manual Script Override */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t border-white/5 relative z-0">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Manual Script Override (Optional)</label>
                  </div>
                  <textarea 
                    value={script} 
                    onChange={e => setScript(e.target.value)} 
                    placeholder={outputType === 'image' ? "Image Prompt override..." : "Paste your own script here to skip AI generation..."}
                    className="w-full bg-transparent border border-white/10 p-6 rounded-[30px] text-white h-32 resize-none outline-none focus:border-text-accent placeholder:text-white/10 text-sm" 
                  />
              </motion.div>
            </div>

            {/* Right Sidebar: Assets & Deploy */}
            <div className="w-[400px] bg-[#080808] border-l border-white/5 p-12 flex flex-col justify-between">
              <div className="space-y-10">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Asset Payload</label>
                <div className="space-y-4">
                  {[
                    { label: 'Primary Overlay', type: 'Foreground', target: fgRef },
                    { label: 'Environment', type: 'Background', target: bgRef },
                    { label: 'Voice DNA', type: 'Audio Track', target: audioRef }
                  ].map(asset => (
                    <button
                      key={asset.label}
                      onClick={() => asset.target.current?.click()}
                      className={`w-full p-6 bg-white/5 border border-dashed rounded-[30px] flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-all ${uploadedFiles[asset.type as keyof typeof uploadedFiles] ? 'border-green-500/50 text-green-400' : 'border-white/10 text-white/30'} hover:border-white/30 hover:bg-white/[0.02]`}
                    >
                      {asset.label} {uploadedFiles[asset.type as keyof typeof uploadedFiles] ? '✓' : '+'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <button onClick={handleSave} disabled={loading} className="w-full bg-white hover:bg-text-accent text-black py-8 rounded-[35px] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] active:scale-95">
                  {loading ? 'Initializing...' : 'Launch Production'}
                </button>
                <button onClick={onClose} className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">Terminate</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}